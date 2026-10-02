import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable, SummaryRows, Meter } from "@/components/page-parts";

const rows = [
  { id: "a", desc: "Persembahan", amount: "Rp 350.000" },
  { id: "b", desc: "Snack", amount: "Rp 85.000" },
];

describe("DataTable", () => {
  const html = renderToStaticMarkup(
    <DataTable
      caption="Transaksi"
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        { key: "desc", header: "Uraian", primary: true, cell: (r) => r.desc },
        { key: "amount", header: "Jumlah", align: "right", cell: (r) => r.amount },
      ]}
      footer={[{ label: "Pemasukan", value: "Rp 350.000" }]}
    />
  );

  it("renders a captioned table for wide screens and a card list for phones", () => {
    expect(html).toContain("<caption");
    expect(html).toContain("sm:table");
    expect(html).toContain("sm:hidden");
    // Each row appears once per layout.
    expect(html.match(/Persembahan/g)?.length).toBe(2);
  });

  it("right-aligns numeric columns in tabular mono", () => {
    expect(html).toMatch(/num text-right font-mono/);
  });

  it("labels non-primary cells on phones with their column name", () => {
    expect(html).toContain(">Jumlah</dt>");
  });
});

describe("SummaryRows", () => {
  it("is a definition list with the emphasised total", () => {
    const html = renderToStaticMarkup(
      <SummaryRows
        label="Saldo"
        rows={[
          { label: "Kas Kecil", value: "Rp 1" },
          { label: "Total saldo", value: "Rp 1", emphasis: true },
        ]}
      />
    );
    expect(html).toContain('<dl aria-label="Saldo"');
    expect(html.match(/<dt/g)?.length).toBe(2);
  });
});

describe("Meter", () => {
  it("exposes progress to assistive tech and turns sage when complete", () => {
    const partial = renderToStaticMarkup(<Meter value={5} max={8} label="Slot" />);
    expect(partial).toContain('role="progressbar"');
    expect(partial).toContain('aria-valuenow="5"');
    expect(partial).toContain("meter-fill");
    const full = renderToStaticMarkup(<Meter value={8} max={8} label="Slot" />);
    expect(full).toContain("bg-sage");
  });
});
