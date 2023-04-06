import * as nodemailer from "nodemailer";
import {config} from "./config";

export const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: config.user,
        pass: config.password,
    },
});

export const sendConfirmationEmail = (email: string, subject: string, h1: string, h2: string, text: string, url?: string) => {
        const host = 'http://localhost:3000';
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
//
// transport.sendMail({
//     from: config.user,
//     to: email,
//     subject: "Please confirm your account",
//     html: `<h1>MyRealCoins - Email Confirmation</h1>
//         <h2>Welcome to MyRealCoins</h2>
//         <p>Thank you for being with us. Please confirm your email by clicking on the following link:</p>
//         <a href=http://localhost:3000/confirm/${confirmationCode}>Click here</a>
//         </div>`,
// }).catch((err) => {throw new Error(err)});

