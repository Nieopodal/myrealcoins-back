import nodemailer from "nodemailer";
import {config} from "./config";

export const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: config.user,
        pass: config.password,
    },
});

export const sendConfirmationEmail = (email: string, subject: string, h1: string, h2: string, text: string, url?: string) => {
        const host = 'https://www.myrealcoins.networkmanager.pl/';
        transport.sendMail({
            from: config.user,
            to: email,
            subject: subject,
            html:
                url ?
                    `<h1>MyRealCoins - ${h1}</h1>
        <h2>${h2}</h2>
        <p>${text}</p>
        <a href=${host}/${url}>Click here</a> 
        <p>or copy this URL:</p>
        <p>${host}/${url}</p>
        </div>`
                    : `<h1>MyRealCoins - ${h1}</h1>
        <h2>${h2}</h2>
        <p>${text}</p>
        </div>`
        }).catch((err) => {
            throw new Error(err)
        });
};


