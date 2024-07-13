# Project tracker (backend)

## Description
The project is the backend part for Project tracker application. [Visit](https://project-tracker-psi.vercel.app/).
[Frontend part](https://github.com/JuliaShlykova/project-tracker-frontend).

**API services:**
- register and log in users with plain email and password
- create projects and tasks
- set deadlines and assignees
- add participants to projects
## Data Models
![Data model](data-models.svg)

## Authorization
The user gets two tokens: access and refresh one. Refresh token is divided to two parts: the first one is stored in HttpOnly cookie and the second - just in cookie, both cookies will be sent with only specific request to refresh the access token. The reason behindthe division is in logging out process: when the user logs out, the browser will send request to the server to remove HttpOnly cookie but in case server temporary fails the risk of saving cookie in the browser stays. So, the browser removes one part of refresh token so other part won't be valid.
The access token has a shorter lifespan and is stored in the local storage. It isn't stored as React state for preserving its value in case of page refresh.
There is a lot of discussion whether the tokens should be stored in the LocalStorage or a cookie. First is vulnerable to XSS attacks because injected code can steal your data from the LocalStorage but protects against CSRF because forged request from malicious website won't be able to steal it. The latter is vulnerable to CSRF because forged request from malicious website makes browser send the cookies along but protects against XSS because malicious website don't have access to LocalStorage of the original website.
Thus, if refresh token is exposed, tha hacker will send the request to the server to get a new pair of access/refresh tokens. The user will lose his access to the site and will log in and get a new pair of tokens, therreby the hacker's pair becomes invalid. If access token is compromised, the hacker will get access to the site only until it expires.

## Security
- Since React is used as a frontend tool and according to [jsx-prevents-injection-attacks](https://legacy.reactjs.org/docs/introducing-jsx.html#jsx-prevents-injection-attacks) we may not escape user input for further output ot others.
- Furthermore, it's preferable to save raw data in a database and sanitize the output if needed. So 'escape' from 'express-validator' library is not used since input validation is used to prevent mongoDB injection and there is no risk in XSS-attack for this web application - there is no search input, no filtering documents based on raw user input.
- To prevent overconsumption of server resources it's better to limit data size that user can send to the server:
  - compress images;
  - limit text length.
- To secure passwords minimal length of characters for it set (8) and no maximum except for bcrypt library limitations used for hashing passwords.
- To prevent DoS attacks there is limit of requests from one user.

## Technologies used
- NodeJS
- Express
- MongoDB database
- Mongoose
- jsonwebtoken
- passport
- imagekit