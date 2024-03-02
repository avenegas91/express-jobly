"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = express.Router({ mergeParams: true });


/* POST / {job} => {job}
- job should be { title, salary, equity, companyHandle }
- Returns { id, title, salary, equity, companyHandle }
- REQUIRES ADMIN AUTH! */

router.post("/", ensureAdmin, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    }
    catch (err) {
        return next(err);
    }
});


/* GET / => { jobs: [ { id, title, salary, equity, companyHandle, companyName }, ...] }
-may contain search filter in the query for:
    - min salary
    - has equity
    - title
Does NOT require auth */

router.get("/", async (req, res, next) => {
    const q = req.query;
    if (q.minSalary !== undefined) q.minSalary = +q.minSalary;
    q.hasEquity = q.hasEquity === "true";

    try {
        const validator = jsonschema.validate(q, jobSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const jobs = await Job.findAll(q);
        return res.json({ jobs });
    }
    catch (err) {
        return next(err);
    }
});


/* GET /[jobId] => { job }
- Returns { id, title, salary, equity, company } where company is { handle, name, description, numEmployees, logoUrl }
Does NOT require auth */

router.get("/:id", async (req, res, next) => {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    }
    catch (err) {
        return next (err);
    }
});


/* PATCH /[jobId] { fld1, fld2, ... } => { job }
- Data may include: { title, salary, equity }
- Returns { id, title, salary, equity and company handle }
- REQUIRES ADMIN AUTH! */

router.patch("/:id", ensureAdmin, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    }
    catch (err) {
        return next (err);
    }
});


/* DELETE /[handle]  =>  { deleted: id }
- REQUIRES ADMIN AUTH! */

router.delete("/:id", ensureAdmin, async (req, res, next) => {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: +req.params.id });
    }
    catch (err) {
        return next(err);
    }
});


module.exports = router;