"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, CheckCircle2, Copy, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  fetchInventoryEntries,
  createInventoryEntry,
  updateInventoryEntry,
  markInventoryEntryPurchased,
  deleteInventoryEntry,
  duplicateInventoryEntry,
  type InventoryEntryDto,
  type DateRangeParams,
} from "@/lib/inventory-api"
import { dashboardSummaryKey } from "@/lib/dashboard-api"

interface InventoryEntriesTabProps {
  dateRangeParams: DateRangeParams
  isReady: boolean
  currentUser: string
}

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

const emptyForm = {
  item_name: "",
  quantity: "",
  total_cost: "",
  entry_date: todayStr(),
  status: "pending" as "pending" | "purchased",
}

export function InventoryEntriesTab({ dateRangeParams, isReady, currentUser }: InventoryEntriesTabProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [editingEntry, setEditingEntry] = useState<InventoryEntryDto | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const listKey = isReady
    ? (["inventory-entries", dateRangeParams.range, dateRangeParams.start, dateRangeParams.end] as const)
    : null
  const { data: entries, isLoading } = useSWR(listKey, () => fetchInventoryEntries(dateRangeParams))

  const filtered = (entries || []).filter(
    (e) => !search || e.item_name.toLowerCase().includes(search.toLowerCase())
  )

  function refreshAll() {
    if (listKey) mutate(listKey)
    mutate(dashboardSummaryKey(dateRangeParams))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingEntry(null)
  }

  async function handleSave(addNext: boolean) {
    if (!form.item_name || !form.quantity || !form.total_cost) {
      toast({
        title: "Missing information",
        description: "Item name, quantity, and total cost are required.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        item_name: form.item_name,
        quantity: parseFloat(form.quantity),
        total_cost: parseFloat(form.total_cost),
        entry_date: form.entry_date,
        status: form.status,
        created_by: currentUser,
      }

      if (editingEntry) {
        await updateInventoryEntry(editingEntry.id, payload)
        toast({ title: "Entry updated" })
      } else {
        await createInventoryEntry(payload)
        toast({ title: "Entry added" })
      }

      refreshAll()

      if (addNext && !editingEntry) {
        setForm({ ...emptyForm, entry_date: form.entry_date })
      } else {
        setShowAdd(false)
        resetForm()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save entry",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkPurchased(entry: InventoryEntryDto) {
    if (listKey && entries) {
      mutate(listKey, entries.map((e) => (e.id === entry.id ? { ...e, status: "purchased" as const } : e)), false)
    }
    try {
      await markInventoryEntryPurchased(entry.id)
      refreshAll()
      toast({ title: `${entry.item_name} marked as purchased` })
    } catch (err) {
      refreshAll()
      toast({ title: "Error", description: "Failed to mark as purchased", variant: "destructive" })
    }
  }

  async function handleDelete(entry: InventoryEntryDto) {
    if (listKey && entries) {
      mutate(listKey, entries.filter((e) => e.id !== entry.id), false)
    }
    try {
      await deleteInventoryEntry(entry.id)
      refreshAll()
      toast({ title: "Entry deleted" })
    } catch (err) {
      refreshAll()
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" })
    }
  }

  async function handleDuplicate(entry: InventoryEntryDto) {
    try {
      await duplicateInventoryEntry(entry.id)
      refreshAll()
      toast({ title: `${entry.item_name} duplicated for today` })
    } catch (err) {
      toast({ title: "Error", description: "Failed to duplicate entry", variant: "destructive" })
    }
  }

  function openEdit(entry: InventoryEntryDto) {
    setEditingEntry(entry)
    setForm({
      item_name: entry.item_name,
      quantity: String(entry.quantity),
      total_cost: String(entry.total_cost),
      entry_date: entry.entry_date,
      status: entry.status,
    })
    setShowAdd(true)
  }

  function openAdd() {
    resetForm()
    setShowAdd(true)
  }

  function statusBadge(status: InventoryEntryDto["status"]) {
    return (
      <Badge className={status === "purchased" ? "bg-green-600 hover:bg-green-700" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"}>
        {status === "purchased" ? "🟢 Purchased" : "🟡 Pending"}
      </Badge>
    )
  }

  function RowActions({ entry }: { entry: InventoryEntryDto }) {
    return (
      <>
        {entry.status === "pending" && (
          <Button id={`inventoryEntry-${entry.id}-markPurchasedBtn`} size="sm" variant="outline" onClick={() => handleMarkPurchased(entry)}>
            <CheckCircle2 className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Mark Purchased</span>
          </Button>
        )}
        <Button id={`inventoryEntry-${entry.id}-editBtn`} size="sm" variant="ghost" onClick={() => openEdit(entry)} aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button id={`inventoryEntry-${entry.id}-duplicateBtn`} size="sm" variant="ghost" onClick={() => handleDuplicate(entry)} aria-label="Duplicate">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button id={`inventoryEntry-${entry.id}-deleteBtn`} size="sm" variant="ghost" className="text-red-600 hover:text-red-700" aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes &quot;{entry.item_name}&quot; from your inventory records. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(entry)} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button id="openAddInventoryBtn" onClick={openAdd} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" /> Add Inventory
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No inventory entries for this period.</p>
          ) : (
            <>
              {/* Mobile: stacked card list */}
              <div className="sm:hidden divide-y">
                {filtered.map((entry) => (
                  <div key={entry.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{entry.item_name}</p>
                        <p className="text-sm text-gray-500">
                          {entry.quantity} qty · ₹{entry.total_cost.toFixed(2)} · {entry.entry_date}
                        </p>
                      </div>
                      {statusBadge(entry.status)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <RowActions entry={entry} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="p-3 font-medium">Item</th>
                      <th className="p-3 font-medium">Qty</th>
                      <th className="p-3 font-medium">Cost</th>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{entry.item_name}</td>
                        <td className="p-3">{entry.quantity}</td>
                        <td className="p-3">₹{entry.total_cost.toFixed(2)}</td>
                        <td className="p-3">{entry.entry_date}</td>
                        <td className="p-3">{statusBadge(entry.status)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <RowActions entry={entry} />
                          </div>
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
          if (!open) resetForm()
        }}
      >
        <DialogContent aria-describedby="inventory-entry-description">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Inventory Entry" : "Add Inventory"}</DialogTitle>
          </DialogHeader>
          <div id="inventory-entry-description" className="sr-only">
            Add or edit a single inventory purchase entry.
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                placeholder="e.g. Rice"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="total_cost">Total Cost (₹)</Label>
                <Input
                  id="total_cost"
                  type="number"
                  value={form.total_cost}
                  onChange={(e) => setForm({ ...form, total_cost: e.target.value })}
                  placeholder="500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="entry_date">Date</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={form.entry_date}
                  onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as "pending" | "purchased" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">🟡 Pending</SelectItem>
                    <SelectItem value="purchased">🟢 Purchased</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                id="cancelInventoryEntryBtn"
                variant="outline"
                onClick={() => {
                  setShowAdd(false)
                  resetForm()
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              {!editingEntry && (
                <Button id="saveAndAddNextInventoryBtn" variant="outline" disabled={saving} onClick={() => handleSave(true)} className="w-full sm:w-auto">
                  Save & Add Next
                </Button>
              )}
              <Button id="saveInventoryEntryBtn" disabled={saving} onClick={() => handleSave(false)} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
