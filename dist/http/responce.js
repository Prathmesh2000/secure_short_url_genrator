"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.temporaryRedirect = exports.notModified = exports.seeOther = exports.found = exports.movedPermanently = exports.noContent = exports.created = exports.success = exports.redirect = void 0;
const statusCodes_1 = require("./statusCodes");
const redirect = (res, url) => {
    res.redirect(url);
};
exports.redirect = redirect;
const success = (res, data) => {
    res.status(statusCodes_1.HttpStatusCodes.OK).send({
        success: true,
        data
    });
};
exports.success = success;
const created = (res, data) => {
    res.status(statusCodes_1.HttpStatusCodes.CREATED).send({
        success: true,
        data
    });
};
exports.created = created;
const noContent = (res) => {
    res.status(statusCodes_1.HttpStatusCodes.NO_CONTENT).send({
        success: true,
        data: null
    });
};
exports.noContent = noContent;
const movedPermanently = (res, url) => {
    res.status(statusCodes_1.HttpStatusCodes.MOVED_PERMANENTLY).send({
        success: true,
        data: url
    });
};
exports.movedPermanently = movedPermanently;
const found = (res, url) => {
    res.status(statusCodes_1.HttpStatusCodes.FOUND).send({
        success: true,
        data: url
    });
};
exports.found = found;
const seeOther = (res, url) => {
    res.status(statusCodes_1.HttpStatusCodes.SEE_OTHER).send({
        success: true,
        data: url
    });
};
exports.seeOther = seeOther;
const notModified = (res) => {
    res.status(statusCodes_1.HttpStatusCodes.NOT_MODIFIED).send({
        success: true,
        data: null
    });
};
exports.notModified = notModified;
const temporaryRedirect = (res, url) => {
    res.status(statusCodes_1.HttpStatusCodes.TEMPORARY_REDIRECT).send({
        success: true,
        data: url
    });
};
exports.temporaryRedirect = temporaryRedirect;
