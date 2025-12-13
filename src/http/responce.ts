import { Response } from "express";
import { HttpStatusCodes } from "./statusCodes";

export const success = (res: Response, data: any) => {
    res.status(HttpStatusCodes.OK).send({
        success: true,
        data
    });
};

export const created = (res: Response, data: any) => {
    res.status(HttpStatusCodes.CREATED).send({
        success: true,
        data
    });
};

export const noContent = (res: Response) => {
    res.status(HttpStatusCodes.NO_CONTENT).send({
        success: true,
        data: null
    });
};

export const movedPermanently = (res: Response, url: string) => {
    res.status(HttpStatusCodes.MOVED_PERMANENTLY).send({
        success: true,
        data: url
    });
};

export const found = (res: Response, url: string) => {
    res.status(HttpStatusCodes.FOUND).send({
        success: true,
        data: url
    });
};

export const seeOther = (res: Response, url: string) => {
    res.status(HttpStatusCodes.SEE_OTHER).send({
        success: true,
        data: url
    });
};

export const notModified = (res: Response) => {
    res.status(HttpStatusCodes.NOT_MODIFIED).send({
        success: true,
        data: null
    });
};

export const temporaryRedirect = (res: Response, url: string) => {
    res.status(HttpStatusCodes.TEMPORARY_REDIRECT).send({
        success: true,
        data: url
    });
};  