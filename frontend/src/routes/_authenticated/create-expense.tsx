import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useForm } from "@tanstack/react-form";
import {
  createExpense,
  getAllExpensesQueryOptions,
  loadingCreateExpenseQueryOptions,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { createExpenseSchema } from "@server/sharedTypes";
import { Calendar } from "@/components/ui/calendar";
import { DateTime } from "luxon";

export function InputWithLabel() {
  return <div className="grid w-full max-w-sm items-center gap-1.5"></div>;
}

export const Route = createFileRoute("/_authenticated/create-expense")({
  component: CreateExpense,
});

function CreateExpense() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      title: "",
      amount: "0",
      date: DateTime.now()
        .setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
        .toISO()!,
    },
    validators: {
      onChange: createExpenseSchema,
    },
    onSubmit: async ({ value }) => {
      const existingExpenses = await queryClient.ensureQueryData(
        getAllExpensesQueryOptions
      );

      navigate({ to: "/expenses" });

      //loading state
      queryClient.setQueryData(loadingCreateExpenseQueryOptions.queryKey, {
        expense: value,
      });

      try {
        const newExpense = await createExpense({ value });
        queryClient.setQueryData(getAllExpensesQueryOptions.queryKey, {
          ...existingExpenses,
          expenses: [newExpense, ...existingExpenses.expenses],
        });
        toast("Expense Created", {
          description: `Successfully created new expense: ${newExpense.id}`,
        });
      } catch (error) {
        //errorstate
        toast("Error", {
          description: "failed to create new expense",
        });
      } finally {
        queryClient.setQueryData(loadingCreateExpenseQueryOptions.queryKey, {});
      }
    },
  });

  return (
    <div className="p-2">
      <h2>Create Expense</h2>
      <form
        className="flex flex-col max-w-xl m-auto gap-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="title"
          children={(field) => {
            return (
              <div>
                <Label htmlFor={field.name}>Title</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.isTouched &&
                field.state.meta.errors.length ? (
                  <em>
                    {field.state.meta.errors
                      ?.map((e) => e?.message ?? "")
                      .filter(Boolean)
                      .join(", ")}
                  </em>
                ) : null}
              </div>
            );
          }}
        />

        <form.Field
          name="amount"
          validators={{
            onChange: createExpenseSchema.shape.amount,
          }}
          children={(field) => {
            return (
              <div>
                <Label htmlFor={field.name}>Amount</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  type="number"
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.isTouched &&
                field.state.meta.errors.length ? (
                  <em>
                    {field.state.meta.errors
                      ?.map((e) => e?.message ?? "")
                      .filter(Boolean)
                      .join(", ")}
                  </em>
                ) : null}
              </div>
            );
          }}
        />
        <form.Field
          name="date"
          validators={{
            onChange: createExpenseSchema.shape.date,
          }}
          children={(field) => {
            return (
              <div className="self-center">
                <Calendar
                  mode="single"
                  selected={new Date(field.state.value)}
                  onSelect={(date) => {
                    console.log(date);
                    field.handleChange(
                      DateTime.fromJSDate(date ?? new Date())
                        .setZone(
                          Intl.DateTimeFormat().resolvedOptions().timeZone
                        )
                        .toISO()!
                    );
                  }}
                  className="rounded-md border shadow"
                />
                {field.state.meta.isTouched &&
                field.state.meta.errors.length ? (
                  <em>
                    {field.state.meta.errors
                      ?.map((e) => e?.message ?? "")
                      .filter(Boolean)
                      .join(", ")}
                  </em>
                ) : null}
              </div>
            );
          }}
        />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button className="mt-4" disabled={!canSubmit}>
              {isSubmitting ? "..." : "Submit"}
            </Button>
          )}
        />
      </form>
    </div>
  );
}
