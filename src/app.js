import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// CORS(Cross origin Resource sharing) is Express middleware that controls which frontend applications (origins) are allowed to access your backend APIs.
// Browsers block requests from a different origin (different domain, port, or protocol) for security. CORS allows you to specify trusted origins.
// Without CORS, your frontend may get a "CORS Policy" error when trying to call your backend.
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "20kb"}))


// express.static() is Express middleware used to serve static files (images, CSS, JavaScript, PDFs, etc.) directly to the client.
// It makes files inside a specified folder publicly accessible through a URL without writing separate routes.
// In your project, it is used to serve temporary uploaded files from the public folder.
app.use(express.static("public"))

// cookie-parser is Express middleware that reads cookies sent by the client and makes them available in req.cookies.
// It is mainly used for authentication, where Access Tokens or Refresh Tokens are stored in cookies and can be easily accessed by the backend.
// Without cookie-parser, req.cookies will be undefined, and the server won't be able to read cookies.
app.use(cookieParser())

//router import
import router from "./routes/user.routes.js"
//routes declaration
app.use("/users", router);

export {app}