import { Hono } from 'hono';
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const expenseSchema = z.object({
    id: z.number().int().positive().min(1),
    title: z.string().min(3).max(100),
    amount: z.number().int().positive()
})

type Expense = z.infer<typeof expenseSchema>

const createPostSchema = expenseSchema.omit({ id: true })

const fakeExpenses: Expense[] = [
    { id: 1, title: "Groceries", amount: 100 },
    { id: 2, title: "Rent", amount: 500 },
    { id: 3, title: "Gas", amount: 150 },
    { id: 4, title: "Eating out", amount: 200 },
    { id: 5, title: "Miscellaneous", amount: 300 },
]



export const expensesRoute = new Hono()
.get("/", (c) => {
    return c.json({expenses: fakeExpenses})
})
.get("/total-spent", (c) => {
    const totalSpent = fakeExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    return c.json({ totalSpent });
})
.post("/", zValidator("json", createPostSchema), async (c)=>{
    const expense = await c.req.valid("json")
    fakeExpenses.push({...expense, id: fakeExpenses.length + 1})
    c.status(201);
    return c.json(expense)
})
.get("/:id{[0-9]+}", (c) => {
    const id = Number.parseInt(c.req.param('id'));
    const expense = fakeExpenses.find(expense=>expense.id === id)
    if(!expense){
        return c.notFound()
    }
    return c.json({expense})
})
.delete("/:id{[0-9]+}", (c) => {
    const id = Number.parseInt(c.req.param('id'));
    const index = fakeExpenses.findIndex(expense=>expense.id === id)
    if(index === -1){
        return c.notFound()
    }
    const deletedExpense = fakeExpenses.splice(index, 1)[0];
    return c.json({expense: deletedExpense})

})