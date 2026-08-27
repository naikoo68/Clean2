# Third-Party Notices

"My Study Guide" is proprietary software (see `LICENSE`). It is built on top of
the open-source components listed below. Each remains under its own license and
its copyright belongs to its respective authors. This file is provided to
satisfy the attribution requirements of those permissive licenses.

All bundled dependencies use permissive licenses (MIT / ISC / BSD / Apache-2.0)
that allow inclusion in a proprietary, commercially distributed product. None of
them are copyleft (GPL/LGPL/AGPL).

> This list covers the **direct** runtime and build dependencies declared in
> `backend/package.json` and `frontend/package.json`. Each package may pull in
> further transitive dependencies; the full, authoritative set of licenses for a
> given install can be regenerated at any time with a tool such as
> `npx license-checker --summary` (run inside `backend/` and `frontend/`).

## Backend (`backend/package.json`)

| Package | License |
|---------|---------|
| bcryptjs | MIT |
| cloudinary | MIT |
| cors | MIT |
| dotenv | BSD-2-Clause |
| express | MIT |
| express-rate-limit | MIT |
| helmet | MIT |
| jsonwebtoken | MIT |
| mathjax-full | Apache-2.0 |
| mongoose | MIT |
| morgan | MIT |
| multer | MIT |
| nodemailer | MIT-0 |

## Frontend (`frontend/package.json`)

### Runtime dependencies

| Package | License |
|---------|---------|
| chart.js | MIT |
| katex | MIT |
| lucide-react | ISC |
| react | MIT |
| react-chartjs-2 | MIT |
| react-dom | MIT |
| react-router-dom | MIT |

### Build / development dependencies

| Package | License |
|---------|---------|
| @eslint/js | MIT |
| @types/react | MIT |
| @types/react-dom | MIT |
| @vitejs/plugin-react | MIT |
| autoprefixer | MIT |
| eslint | MIT |
| eslint-plugin-react-hooks | MIT |
| eslint-plugin-react-refresh | MIT |
| globals | MIT |
| postcss | MIT |
| tailwindcss | MIT |
| vite | MIT |

---

Full license texts for each package are included within its folder under
`node_modules/<package>/` after installation.
