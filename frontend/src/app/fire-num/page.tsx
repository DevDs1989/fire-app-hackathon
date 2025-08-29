"use client";
import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

axios.defaults.baseURL = "http://localhost:8080/api";

const FireNumberPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [projections, setProjections] = useState<
    { year: number; savings: number }[]
  >([]);
  const MonthlyIncomeRef = React.useRef<HTMLInputElement>(null);
  const MonthlyExpensesRef = React.useRef<HTMLInputElement>(null);
  const AnnualReturnRateRef = React.useRef<HTMLInputElement>(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    setProjections([]);

    const monthlyIncome = MonthlyIncomeRef.current?.value;
    const monthlyExpenses = MonthlyExpensesRef.current?.value;
    const returnRate = AnnualReturnRateRef.current?.value;

    if (
      !monthlyIncome ||
      !monthlyExpenses ||
      Number(monthlyIncome) < 0 ||
      Number(monthlyExpenses) < 0
    ) {
      setError("Please enter valid positive numbers for income and expenses.");
      return;
    }

    try {
      const response = await axios.post("/fire", {
        monthly_income: Number(monthlyIncome),
        monthly_expenses: Number(monthlyExpenses),
        return_rate: returnRate ? Number(returnRate) / 100 : undefined,
      });

      const { fireNumber, yearsToFire, projections } = response.data;

      setResult(
        `Your FIRE number is $${fireNumber.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}. Estimated years to FIRE: ${yearsToFire}.`,
      );

      setProjections(projections || []);
    } catch (err: any) {
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  // Improved Graph component using recharts for better fit and responsiveness
  const FireGraph = ({
    data,
  }: {
    data: { year: number; savings: number }[];
  }) => (
    <div
      style={{ width: "100%", minHeight: 300, height: "40vh", maxHeight: 500 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 24, right: 32, left: 64, bottom: 24 }} // Increased left margin!
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            label={{
              value: "Year",
              position: "insideBottom",
              offset: -8,
              style: { textAnchor: "middle" },
            }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{
              value: "Savings ($)",
              angle: -90,
              position: "left", // Changed from "insideLeft" to "left"
              offset: 20,
              style: { textAnchor: "middle" },
            }}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) =>
              `$${Number(value).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}`
            }
            labelFormatter={(label) => `Year: ${label}`}
          />
          <Legend verticalAlign="top" height={36} />
          <Line
            type="monotone"
            dataKey="savings"
            name="Projected Savings"
            stroke="#82ca9d"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <Head>
        <title>Fire Number Calculator</title>
        <meta
          name="description"
          content="Calculate your FIRE number to achieve financial independence and early retirement."
        />
      </Head>
      <main className="mx-auto my-10 flex h-full max-w-4xl flex-col content-center justify-center px-4 py-8 select-none md:my-20">
        <h1 className="mb-20 text-center text-4xl font-bold tracking-tight uppercase md:text-6xl lg:text-7xl">
          Fire Number Calculator
        </h1>
        <Card className="flex h-full flex-col backdrop-blur-sm transition hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">
              Calculate Your FIRE Number
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="monthlyIncome"
                className="block text-sm font-medium"
              >
                Monthly Income
              </label>
              <Input
                ref={MonthlyIncomeRef}
                id="monthlyIncome"
                type="number"
                placeholder="Enter your monthly income"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="monthlyExpenses"
                className="block text-sm font-medium"
              >
                Monthly Expenses
              </label>
              <Input
                ref={MonthlyExpensesRef}
                id="monthlyExpenses"
                type="number"
                placeholder="Enter your monthly expenses"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="annualReturnRate"
                className="block text-sm font-medium"
              >
                Expected Annual Return Rate (%)
              </label>
              <Input
                ref={AnnualReturnRateRef}
                id="annualReturnRate"
                type="number"
                placeholder="Enter expected annual return rate"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {result && <p className="font-semibold text-green-600">{result}</p>}
            <Button className="mt-4 w-full" onClick={handleCalculate}>
              Calculate FIRE Number
            </Button>
            {projections.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-4 text-xl font-semibold">
                  Savings Projection
                </h2>
                <FireGraph data={projections} />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default FireNumberPage;
