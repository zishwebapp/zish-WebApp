"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchSales, createSale, deleteSale, type SaleDto } from "@/lib/sales-api"
import type { DateRangeParams } from "@/lib/inventory-api"
import { dashboardSummaryKey } from "@/lib/dashboard-api"

interface SalesTabProps {
  dateRangeParams: DateRangeParams
  isReady: boolean
  currentUser: string
}

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

const emptyForm = { amount: "", sale_date: todayStr(), notes: "" }

export function SalesTab({ dateRangeParams, isReady, currentUser }: SalesTabProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const listKey = isReady
    ? (["sales", dateRangeParams.range, dateRangeParams.start, dateRangeParams.end] as const)
    : null
  const { data: sales, isLoading } = useSWR(listKey, () => fetchSales(dateRangeParams))

  const filtered = (sales || []).filter(
    (s) => !search || s.notes.toLowerCase().includes(search.toLowerCase())
  )

  function refreshAll() {
    if (listKey) mutate(listKey)
    mutate(dashboardSummaryKey(dateRangeParams))
  }

  async function handleSave(addNext: boolean) {
    if (!form.amount) {
      toast({ title: "Missing information", description: "Sale amount is required.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      await createSale({
        amount: parseFloat(form.amount),
        sale_date: form.sale_date,
        notes: form.notes,
        created_by: currentUser,
      })
      refreshAll()
      toast({ title: "Sale logged" })

      if (addNext) {
        setForm({ ...emptyForm, sale_date: form.sale_date })
      } else {
        setShowAdd(false)
        setForm(emptyForm)
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to log sale",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(sale: SaleDto) {
    if (listKey && sales) {
      mutate(listKey, sales.filter((s) => s.id !== sale.id), false)
    }
    try {
      await deleteSale(sale.id)
      refreshAll()
      toast({ title: "Sale deleted" })
    } catch (err) {
      refreshAll()
      toast({ title: "Error", description: "Failed to delete sale", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          id="openAddSaleBtn"
          onClick={() => {
            setForm(emptyForm)
            setShowAdd(true)
          }}
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Sale
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No sales logged for this period.</p>
          ) : (
            <>
              {/* Mobile: stacked card list */}
              <div className="sm:hidden divide-y">
                {filtered.map((sale) => (
                  <div key={sale.id} className="p-4 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">₹{sale.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{sale.sale_date}</p>
                      {sale.notes && <p className="text-sm text-gray-600 truncate">{sale.notes}</p>}
                    </div>
                    <DeleteButton sale={sale} onConfirm={handleDelete} />
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="p-3 font-medium">Amount</th>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Notes</th>
                      <th className="p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sale) => (
                      <tr key={sale.id} className="border-b last:border-0">
                        <td className="p-3 font-medium">₹{sale.amount.toFixed(2)}</td>
                        <td className="p-3">{sale.sale_date}</td>
                        <td className="p-3 text-gray-600">{sale.notes || "—"}</td>
                        <td className="p-3">
                          <DeleteButton sale={sale} onConfirm={handleDelete} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          setShowAdd(open)
          if (!open) setForm(emptyForm)
        }}
      >
        <DialogContent aria-describedby="add-sale-description">
          <DialogHeader>
            <DialogTitle>Add Sale</DialogTitle>
          </DialogHeader>
          <div id="add-sale-description" className="sr-only">
            Log a cash or walk-in sale that wasn&apos;t placed through the web ordering system.
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Sale Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="1200"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="sale_date">Date</Label>
              <Input
                id="sale_date"
                type="date"
                value={form.sale_date}
                onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. lunch rush, walk-in cash"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                id="cancelAddSaleBtn"
                variant="outline"
                onClick={() => {
                  setShowAdd(false)
                  setForm(emptyForm)
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button id="saveAndAddNextSaleBtn" variant="outline" disabled={saving} onClick={() => handleSave(true)} className="w-full sm:w-auto">
                Save & Add Next
              </Button>
              <Button id="saveSaleBtn" disabled={saving} onClick={() => handleSave(false)} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DeleteButton({ sale, onConfirm }: { sale: SaleDto; onConfirm: (sale: SaleDto) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button id={`sale-${sale.id}-deleteBtn`} size="sm" variant="ghost" className="text-red-600 hover:text-red-700" aria-label="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the ₹{sale.amount.toFixed(2)} entry from {sale.sale_date}. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(sale)} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
