import express from "express";
const app = express();

// An unauthenticated read of the payments table. This is the finding the
// action exists to catch, and the self-test asserts that it does.
app.get("/payments", async (req, res) => {
  const rows = await prisma.payment.findMany();
  res.json(rows);
});
