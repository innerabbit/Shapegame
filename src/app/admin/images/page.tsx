'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

import { generateAllCards, type SeedCard } from '@/lib/cards/generate-seed';
import {
  GEN_STATUS_LABELS,
  RARITY_COLORS,
  RARITY_LABELS,
  MANA_COLORS,
  SHAPES,
} from '@/lib/constants';
import { CardDetailPanel } from '@/components/admin/card-detail-panel';

// ── Column definitions ─────────────────────────────────

const columns: ColumnDef<SeedCard>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: 'card_number',
    header: '#',
    size: 60,
    cell: ({ row }) => (
      <span className="font-mono text-neutral-400 text-xs">
        #{String(row.original.card_number).padStart(3, '0')}
      </span>
    ),
  },
  {
    accessorKey: 'shape',
    header: 'Shape',
    cell: ({ row }) => {
      const shapeDef = SHAPES.find((s) => s.shape === row.original.shape);
      return (
        <span className="flex items-center gap-1.5 text-sm">
          <span>{shapeDef?.emoji}</span>
          <span className="capitalize">{row.original.shape}</span>
        </span>
      );
    },
  },
  {
    accessorKey: 'material',
    header: 'Material',
    cell: ({ row }) => (
      <span className="capitalize text-sm">{row.original.material}</span>
    ),
  },
  {
    accessorKey: 'background',
    header: 'Background',
    cell: ({ row }) => (
      <span className="capitalize text-sm">
        {row.original.background.replace('_', ' ')}
      </span>
    ),
  },
  {
    accessorKey: 'mana_color',
    header: 'Mana',
    cell: ({ row }) => {
      const mana = MANA_COLORS[row.original.mana_color];
      return (
        <span className="text-sm" title={mana.label}>
          {mana.emoji}
        </span>
      );
    },
    size: 60,
  },
  {
    accessorKey: 'rarity_tier',
    header: 'Rarity',
    cell: ({ row }) => {
      const rarity = row.original.rarity_tier;
      const colors = RARITY_COLORS[rarity];
      return (
        <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border} text-xs`}>
          {RARITY_LABELS[rarity]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'wave',
    header: 'Wave',
    cell: ({ row }) => (
      <Badge variant="outline" className="bg-neutral-800 text-neutral-300 border-neutral-700 text-xs">
        W{row.original.wave}
      </Badge>
    ),
    size: 70,
  },
  {
    id: 'stats',
    header: 'Stats',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-neutral-400">
        {row.original.atk}/{row.original.def}/{row.original.hp} ({row.original.mana_cost})
      </span>
    ),
  },
  {
    accessorKey: 'gen_status',
    header: 'Status',
    cell: ({ row }) => {
      const status = GEN_STATUS_LABELS[row.original.gen_status];
      return (
        <Badge className={`${status.color} text-xs`}>
          {status.label}
        </Badge>
      );
    },
  },
];

// ── Main page component ────────────────────────────────

export default function ImagesPage() {
  const [cards, setCards] = useState<SeedCard[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedCard, setSelectedCard] = useState<SeedCard | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const allCards = generateAllCards();
    setCards(allCards);
  }, []);

  // Update a single card's status
  const updateCardStatus = useCallback((cardNumber: number, newStatus: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.card_number === cardNumber ? { ...c, gen_status: newStatus } : c
      )
    );
  }, []);

  // Batch update cards by row indices
  const batchUpdateStatus = useCallback((rowIndices: string[], newStatus: string) => {
    const indices = new Set(rowIndices.map(Number));
    setCards((prev) =>
      prev.map((c, i) =>
        indices.has(i) ? { ...c, gen_status: newStatus } : c
      )
    );
    setRowSelection({});
  }, []);

  // Navigate to next card in the table
  const navigateCard = useCallback((direction: 'prev' | 'next') => {
    if (!selectedCard) return;
    const currentIndex = cards.findIndex((c) => c.card_number === selectedCard.card_number);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < cards.length) {
      setSelectedCard(cards[newIndex]);
    }
  }, [selectedCard, cards]);

  const table = useReactTable({
    data: cards,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  const selectedCount = Object.keys(rowSelection).length;
  const approvedCount = cards.filter((c) =>
    ['approved', 'compositing', 'finalized'].includes(c.gen_status)
  ).length;
  const generatedCount = cards.filter((c) => c.gen_status === 'generated').length;
  const rejectedCount = cards.filter((c) => c.gen_status === 'rejected').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stage 1: Images</h2>
          <p className="text-neutral-400 text-sm mt-1">
            Upload and curate raw arts for {cards.length} cards
          </p>
        </div>
        <div className="text-right space-y-1">
          <div className="text-sm text-neutral-400">
            {approvedCount}/{cards.length} approved
          </div>
          <Progress value={cards.length > 0 ? (approvedCount / cards.length) * 100 : 0} className="h-1.5 w-32" />
          <div className="flex items-center gap-2 text-xs text-neutral-500 justify-end">
            {generatedCount > 0 && <span>{generatedCount} generated</span>}
            {rejectedCount > 0 && <span className="text-red-400">{rejectedCount} rejected</span>}
          </div>
        </div>
      </div>

      {/* Filters + Batch Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          onValueChange={(value) =>
            table.getColumn('wave')?.setFilterValue(value === 'all' ? undefined : Number(value))
          }
        >
          <SelectTrigger className="w-[130px] bg-neutral-900 border-neutral-700 text-sm">
            <SelectValue placeholder="All Waves" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-700">
            <SelectItem value="all">All Waves</SelectItem>
            <SelectItem value="1">Wave 1</SelectItem>
            <SelectItem value="2">Wave 2</SelectItem>
            <SelectItem value="3">Wave 3</SelectItem>
            <SelectItem value="4">Wave 4</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) =>
            table.getColumn('gen_status')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-[150px] bg-neutral-900 border-neutral-700 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-700">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="finalized">Finalized</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) =>
            table.getColumn('rarity_tier')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-[140px] bg-neutral-900 border-neutral-700 text-sm">
            <SelectValue placeholder="All Rarities" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-700">
            <SelectItem value="all">All Rarities</SelectItem>
            <SelectItem value="common">Common</SelectItem>
            <SelectItem value="rare">Rare</SelectItem>
            <SelectItem value="epic">Epic</SelectItem>
            <SelectItem value="legendary">Legendary</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) =>
            table.getColumn('material')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-[130px] bg-neutral-900 border-neutral-700 text-sm">
            <SelectValue placeholder="All Materials" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-700">
            <SelectItem value="all">All Materials</SelectItem>
            <SelectItem value="flat">Flat</SelectItem>
            <SelectItem value="3d">3D</SelectItem>
            <SelectItem value="chrome">Chrome</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
          </SelectContent>
        </Select>

        {selectedCount > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-neutral-400">{selectedCount} selected</span>
            <Button
              size="sm"
              variant="outline"
              className="bg-green-900/50 border-green-700 text-green-300 hover:bg-green-900"
              onClick={() => {
                batchUpdateStatus(Object.keys(rowSelection), 'approved');
                toast.success(`${selectedCount} cards approved`);
              }}
            >
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-red-900/50 border-red-700 text-red-300 hover:bg-red-900"
              onClick={() => {
                batchUpdateStatus(Object.keys(rowSelection), 'rejected');
                toast.error(`${selectedCount} cards rejected`);
              }}
            >
              Reject Selected
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-neutral-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-neutral-400 text-xs uppercase tracking-wide bg-neutral-900/50"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : (
                        <button
                          className="flex items-center gap-1 hover:text-neutral-200 transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && ' \u2191'}
                          {header.column.getIsSorted() === 'desc' && ' \u2193'}
                        </button>
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-neutral-800 hover:bg-neutral-900/50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                    setSelectedCard(row.original);
                    setSheetOpen(true);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-neutral-500">
                  No cards found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} cards
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-neutral-900 border-neutral-700"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-neutral-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="bg-neutral-900 border-neutral-700"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Card Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-neutral-900 border-neutral-800 w-[500px] sm:max-w-[500px]">
          {selectedCard && (
            <CardDetailPanel
              card={selectedCard}
              onApprove={() => {
                updateCardStatus(selectedCard.card_number, 'approved');
                toast.success(
                  `Card #${String(selectedCard.card_number).padStart(3, '0')} approved`,
                  { description: `${selectedCard.shape} / ${selectedCard.material} / ${selectedCard.background}` }
                );
                // Auto-navigate to next card
                navigateCard('next');
              }}
              onReject={() => {
                updateCardStatus(selectedCard.card_number, 'rejected');
                toast.error(
                  `Card #${String(selectedCard.card_number).padStart(3, '0')} rejected`,
                  { description: `${selectedCard.shape} / ${selectedCard.material} / ${selectedCard.background}` }
                );
                navigateCard('next');
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
