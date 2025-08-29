import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "http://localhost:3000" })); // Adjust the origin as needed
app.use(express.json());
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.post("/api/fire", (req: Request, res: Response) => {
  const { monthly_income, monthly_expenses, return_rate } = req.body;

  if (
    typeof monthly_income !== "number" ||
    typeof monthly_expenses !== "number" ||
    (return_rate !== undefined && typeof return_rate !== "number")
  ) {
    return res.status(400).json({
      error:
        "Invalid input. Please provide valid numbers for income, expenses, and return rate.",
    });
  }

  const result = calculateFire(
    monthly_income,
    monthly_expenses,
    return_rate ?? 0.05,
  );

  res.json(result);
});
function calculateFire(
  monthlyIncome: number,
  monthlyExpences: number,
  returnRate: number,
) {
  try {
    const annualExpences = monthlyExpences * 12;
    const fireNumber = annualExpences * 25;
    const yearlySavings = (monthlyIncome - monthlyExpences) * 12;
    let savings = 0;
    let yearsToFire = 0;
    const projections: { year: number; savings: number }[] = [];
    if (yearlySavings <= 0) {
      return {
        fireNumber: fireNumber,
        yearsToFire: null,
        projections: [],
        message:
          "Your savings rate is zero or negative. FIRE is not possible with current values.",
      };
    }

    while (savings < fireNumber && yearsToFire < 100) {
      savings = savings * (1 + returnRate) + yearlySavings;
      yearsToFire += 1;
      projections.push({
        year: yearsToFire,
        savings: parseFloat(savings.toFixed(2)),
      });
    }

    return {
      fireNumber: parseFloat(fireNumber.toFixed(2)),
      yearsToFire: yearsToFire,
      projections: projections,
    };
  } catch (error) {
    return { error: `Calculation error: ${error}` };
  }
}
