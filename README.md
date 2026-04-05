# SparkFlow

A browser-based personal expense tracker. No backend, no account, no setup.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## Features

- Login with any name or email. Data is stored per user in the browser.
- Balance, income, and expense totals update in real time.
- Expense breakdown by category (doughnut chart).
- Daily spending trend for the last 7 days (line chart).
- Transaction history table with a running balance column, grouped by date.
- Category options change based on whether you pick Expense or Income.
- Toast notifications on add and delete.
- Works on mobile and desktop.

## Project Structure

```
SparkFlow-Smart-Personal-Expense-Tracker/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── README.md
├── LICENSE
└── .gitignore
```

## Getting Started

Open `index.html` directly in a browser, or run a local server:

```bash
python3 -m http.server 8000
```

Then go to `http://localhost:8000`.

## Tech Stack

| | |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling, layout, responsive |
| JavaScript (ES6+) | App logic, DOM, localStorage |
| [Chart.js 4](https://www.chartjs.org/) | Charts |
| [Font Awesome 6](https://fontawesome.com/) | Icons |
| `crypto.randomUUID()` | Unique transaction IDs |

## How Login Works

There is no server. When you enter a name:

- It becomes the localStorage key (`expenses_yourname`)
- The same name on the same browser restores your data
- Different names are isolated from each other

Data is cleared if you clear your browser storage.

## Transaction Data Shape

```js
{
  id: "uuid",
  desc: "Coffee",
  amount: 4.50,
  type: "expense",
  category: "Food",
  date: "2026-04-05"
}
```

## Ideas for Future Features

- Dark mode
- Export to CSV
- Budget goals per category
- Date range filter

## License

[MIT](LICENSE)