import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Panel } from "@/components/report-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FIELD_DATA_TYPES,
  deleteTableField,
  listTableFields,
  upsertTableField,
  type TableField,
  type TableFieldInput,
} from "@/lib/table-master";

const EMPTY: TableFieldInput = {
  field_name: "",
  ui_label: "",
  sap_field: "",
  data_type: "text",
  is_key: false,
  is_required: false,
  sort_order: 100,
};

export function TableFieldsPanel({
  tableKey,
  canEdit,
}: {
  tableKey: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const fieldsQuery = useQuery({
    queryKey: ["table-fields", tableKey],
    queryFn: () => listTableFields(tableKey),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TableField | null>(null);
  const [form, setForm] = useState<TableFieldInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: (fieldsQuery.data?.length ?? 0) * 10 + 10 });
    setErrors({});
    setOpen(true);
  }

  function openEdit(field: TableField) {
    setEditing(field);
    setForm({
      field_name: field.field_name,
      ui_label: field.ui_label,
      sap_field: field.sap_field,
      data_type: field.data_type,
      is_key: field.is_key,
      is_required: field.is_required,
      sort_order: field.sort_order,
    });
    setErrors({});
    setOpen(true);
  }

  function validate(): boolean {
    const next: Record<string, string | undefined> = {};
    if (!/^[a-z][a-z0-9_]*$/.test(form.field_name.trim()))
      next['field_name'] = "Lowercase letters, digits and underscores (e.g. posting_date)";
    if (!form.ui_label.trim()) next['ui_label'] = "UI label is required";
    if (!/^[A-Za-z][A-Za-z0-9_\-/.]*$/.test(form.sap_field.trim()))
      next['sap_field'] = "SAP field name is required (e.g. BUDAT)";
    setErrors(next);
    return Object.values(next).every((value) => !value);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error("Please correct the highlighted fields");
      await upsertTableField(
        tableKey,
        {
          ...form,
          field_name: form.field_name.trim(),
          ui_label: form.ui_label.trim(),
          sap_field: form.sap_field.trim().toUpperCase(),
        },
        editing?.id,
      );
    },
    onSuccess: () => {
      toast.success(editing ? "Field updated" : "Field added");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["table-fields", tableKey] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not save field"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTableField(id),
    onSuccess: () => {
      toast.success("Field removed");
      queryClient.invalidateQueries({ queryKey: ["table-fields", tableKey] });
    },
    onError: () => toast.error("Could not remove field"),
  });

  const fields = fieldsQuery.data ?? [];

  return (
    <Panel
      title="Table fields & SAP mapping"
      actions={
        canEdit ? (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-3.5" /> Add field
          </Button>
        ) : undefined
      }
    >
      {fieldsQuery.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No fields defined yet. Add each column with its UI label and the matching SAP field name
          so the sync writes SAP values into the correct column.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field name</TableHead>
              <TableHead>UI label</TableHead>
              <TableHead>SAP field</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Flags</TableHead>
              {canEdit ? <TableHead className="w-24 text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-mono text-xs">{field.field_name}</TableCell>
                <TableCell>{field.ui_label}</TableCell>
                <TableCell className="font-mono text-xs">{field.sap_field}</TableCell>
                <TableCell className="text-xs">{field.data_type}</TableCell>
                <TableCell className="space-x-1">
                  {field.is_key ? <Badge variant="secondary">Key</Badge> : null}
                  {field.is_required ? <Badge variant="outline">Required</Badge> : null}
                </TableCell>
                {canEdit ? (
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(field)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove.mutate(field.id)}
                ижь                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit field" : "Add field"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Field name</Label>
              <Input
                className="font-mono"
                placeholder="Enter Field Name"
                value={form.field_name}
                onChange={(event) => setForm((f) => ({ ...f, field_name: event.target.value }))}
              />
              {errors['field_name'] ? (
                <p className="text-[11px] text-destructive">{errors['field_name']}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>UI label</Label>
              <Input
                placeholder="Enter UI Label"
                value={form.ui_label}
                onChange={(event) => setForm((f) => ({ ...f, ui_label: event.target.value }))}
              />
              {errors['ui_label'] ? (
                <p className="text-[11px] text-destructive">{errors['ui_label']}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>SAP field name</Label>
              <Input
                className="font-mono"
                placeholder="Enter SAP Field Name"
                value={form.sap_field}
                onChange={(event) => setForm((f) => ({ ...f, sap_field: event.target.value }))}
              />
              {errors['sap_field'] ? (
                <p className="text-[11px] text-destructive">{errors['sap_field']}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Data type</Label>
              <Select
                value={form.data_type}
                onValueChange={(value) => setForm((f) => ({ ...f, data_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_DATA_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Display order</Label>
              <Input
                type="number"
                placeholder="Enter Display Order"
                value={form.sort_order}
                onChange={(event) =>
                  setForm((f) => ({ ...f, sort_order: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex items-end gap-6 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.is_key}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, is_key: checked }))}
                />
                Key field
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.is_required}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, is_required: checked }))}
                />
                Required
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
