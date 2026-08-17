"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import ATextArea from "@/components/atoms/textArea";
import DataTable from "./_datatable";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";

// ─── helpers ──────────────────────────────────────────────────────────────────

function extractActiveStatement(fullText, from, to) {
  const selected = fullText.slice(from, to).trim();
  if (selected) return selected;
  return null; // null means "run all"
}

// Split full editor text into individual SQL statements
function splitStatements(text) {
  // First try splitting by semicolons
  const bySemicolon = text
    .split(/;(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g)
    .map((s) => s.trim())
    .filter(Boolean);

  if (bySemicolon.length > 1) return bySemicolon;

  // Then try splitting by SQL keywords at the start of a new line
  const sqlStarters = /^(SELECT|WITH|EXEC|EXECUTE|DECLARE|BEGIN|CALL|SET|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/i;
  const lines = text.split("\n");
  const statements = [];
  let current = [];

  for (const line of lines) {
    if (sqlStarters.test(line.trim()) && current.length > 0) {
      const stmt = current.join("\n").trim();
      if (stmt) statements.push(stmt);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    const stmt = current.join("\n").trim();
    if (stmt) statements.push(stmt);
  }

  return statements.length > 0 ? statements : [text.trim()];
}

function frontendGuard(query) {
  const q = query.trim().toLowerCase();
  if (q.startsWith("delete"))   return "DELETE queries are not allowed in the SQL Window.";
  if (q.startsWith("drop"))     return "DROP queries are not allowed in the SQL Window.";
  if (q.startsWith("truncate")) return "TRUNCATE queries are not allowed in the SQL Window.";
  if (q.startsWith("update"))   return "UPDATE queries are not allowed in the SQL Window.";
  return null;
}

// ─── Paginated Result Table ────────────────────────────────────────────────────
const PAGE_SIZE = 50;

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function PaginatedResultTable({ columns, rows }) {
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const filtered = search
    ? rows.filter((row) =>
        row.some((cell) =>
          String(cell ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : rows;

  const sorted =
    sortCol !== null
      ? [...filtered].sort((a, b) => {
          const av = a[sortCol] ?? "";
          const bv = b[sortCol] ?? "";
          const cmp =
            !isNaN(av) && !isNaN(bv)
              ? Number(av) - Number(bv)
              : String(av).localeCompare(String(bv));
          return sortDir === "asc" ? cmp : -cmp;
        })
      : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const slice      = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (idx) => {
    if (sortCol === idx) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(idx); setSortDir("asc"); }
    setPage(1);
  };

  useEffect(() => { setPage(1); }, [search, sortCol, sortDir]);

 

  return (
    <div className="flex flex-col min-h-0 rounded-xl border border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0f172a] overflow-hidden shadow-lg" style={{ height: "400px" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-[#e2e8f0] dark:border-[#1e293b] bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] dark:from-[#1e293b] dark:to-[#0f172a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] shadow-sm">
            <svg className="w-4 h-4 text-[#4A6CF7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1.5 3 3 3h10c1.5 0 3-1 3-3V7c0-2-1.5-3-3-3H7c-1.5 0-3 1-3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8M12 8v8" />
            </svg>
            <span className="font-mono text-base font-semibold text-[#1e293b] dark:text-white">
              {sorted.length.toLocaleString()}
            </span>
            <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">/ {rows.length.toLocaleString()} rows</span>
          </div>
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#64748b] dark:text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-9 pr-3 py-2 text-base rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-white placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4A6CF7] focus:border-transparent transition-all font-mono"
              placeholder="Search results..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-8 h-8 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] hover:text-[#1e293b] dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {getPageNumbers(safePage, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-[#94a3b8] font-mono">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg border text-sm font-mono font-semibold transition-all
                  ${safePage === p
                    ? "bg-[#4A6CF7] border-[#4A6CF7] text-white shadow-md shadow-[#4A6CF7]/25"
                    : "border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] hover:text-[#1e293b] dark:hover:text-white"
                  }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="w-8 h-8 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] hover:text-[#1e293b] dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full border-collapse bg-white dark:bg-[#0f172a]">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] dark:from-[#1e293b] dark:to-[#0f172a]">
            <tr>
              <th className="w-12 text-center border-b border-r border-[#e2e8f0] dark:border-[#1e293b] px-4 py-4 text-[#475569] dark:text-[#94a3b8] font-semibold select-none text-sm uppercase tracking-wider">
                #
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => toggleSort(i)}
                  title={col}
                  className="border-b border-r border-[#e2e8f0] dark:border-[#1e293b] px-5 py-4 text-left font-semibold text-sm uppercase tracking-wider text-[#475569] dark:text-[#94a3b8] cursor-pointer whitespace-nowrap hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{col}</span>
                    <span className="text-[#4A6CF7] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortCol === i ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
           {slice.length === 0 ? (
  <tr>
    <td
      colSpan={columns.length + 1}
      className="text-center py-16 text-[#64748b] dark:text-[#94a3b8]"
    >
      <div className="flex flex-col items-center gap-3">
        <svg className="w-16 h-16 text-[#cbd5e1] dark:text-[#334155]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-base font-medium">Query returned 0 rows</span>
      </div>
    </td>
  </tr>
            ) : (
              slice.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-[#e2e8f0] dark:border-[#1e293b] hover:bg-gradient-to-r hover:from-[#f8fafc] hover:to-transparent dark:hover:from-[#1e293b] dark:hover:to-transparent transition-all duration-150 group"
                >
                  <td className="w-12 text-center border-r border-[#e2e8f0] dark:border-[#1e293b] px-4 py-3 text-[#64748b] dark:text-[#94a3b8] text-base font-mono bg-white dark:bg-[#0f172a]">
                    {(safePage - 1) * PAGE_SIZE + ri + 1}
                  </td>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      title={String(cell ?? "NULL")}
                      className="border-r border-[#e2e8f0] dark:border-[#1e293b] px-5 py-3 text-[#1e293b] dark:text-[#e2e8f0] max-w-[350px] overflow-hidden text-ellipsis whitespace-nowrap bg-white dark:bg-[#0f172a] group-hover:bg-transparent"
                    >
                      {cell === null || cell === undefined ? (
                        <span className="text-[#94a3b8] dark:text-[#64748b] font-mono text-base">NULL</span>
                      ) : (
                        <span className="font-mono text-base">{String(cell)}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const TAB_COUNT = 12;

const SqlWindow = () => {
  const jumpToError = (line, column) => {
  const view = editorViews[activeTab];

  if (!view || !line) return;

  const lineInfo = view.state.doc.line(line);

  const pos = lineInfo.from + ((column || 1) - 1);

  view.dispatch({
    selection: {
      anchor: pos
    }
  });

  view.focus();
};
  const user = useCurrentUser();

  const [activeTab, setActiveTab]     = useState(0);
  const [queries, setQueries]         = useState(Array(TAB_COUNT).fill(""));
  // results[tab] = Array of { columns, rows, message, error, query }
  const [results, setResults]         = useState(Array(TAB_COUNT).fill([]));
  const [errors, setErrors]           = useState(Array(TAB_COUNT).fill(""));
  const [messages, setMessages]       = useState(Array(TAB_COUNT).fill(""));
  const [loading, setLoading]         = useState(false);
  const [editorViews, setEditorViews] = useState(Array(TAB_COUNT).fill(null));
  const [tableSuggestions, setTableSuggestions]   = useState([]);
  const [columnSuggestions, setColumnSuggestions] = useState({});
  const [executionTime, setExecutionTime] = useState(null);

  // Track dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Fetch table names
  useEffect(() => {
    if (!user?.Comp_Code) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_URL}/employee/getTableNames`, {
        headers: { compcode: user.Comp_Code },
      })
      .then((res) => setTableSuggestions(res.data))
      .catch(console.error);
  }, [user?.Comp_Code]);

  const combinedCompletions = [
    ...tableSuggestions.map((name) => ({ label: name, type: "variable" })),
    ...Object.entries(columnSuggestions).flatMap(([table, cols]) =>
      cols.map((col) => ({ label: col, type: "property", info: `Column of ${table}` }))
    ),
  ];

const runQuery = async () => {
  const view = editorViews[activeTab];
  let statementsToRun = [];

  if (view) {
    const s = view.state;
    const selected = extractActiveStatement(
      s.doc.toString(),
      s.selection.main.from,
      s.selection.main.to
    );
    
    if (selected) {
      // User has selected specific text — run only that
      statementsToRun = [selected];
    } else {
      const fullQuery = s.doc.toString();
      const trimmedQuery = fullQuery.trim();
      const upperQuery = trimmedQuery.toUpperCase();
      
      // Check if it's a CTE (starts with WITH) - treat as single statement
      if (upperQuery.startsWith('WITH')) {
        statementsToRun = [fullQuery];
      } 
      // Check if it's a complex query with multiple statements but we should keep together
      else if (upperQuery.includes('WITH') && upperQuery.includes('SELECT') && !fullQuery.includes(';')) {
        statementsToRun = [fullQuery];
      }
      // Otherwise split normally
      else {
        statementsToRun = splitStatements(fullQuery);
      }
    }
  } else {
    const fullQuery = queries[activeTab];
    const trimmedQuery = fullQuery.trim();
    const upperQuery = trimmedQuery.toUpperCase();
    
    // Check if it's a CTE (starts with WITH) - treat as single statement
    if (upperQuery.startsWith('WITH')) {
      statementsToRun = [fullQuery];
    }
    // Check if it's a complex query with multiple statements but we should keep together
    else if (upperQuery.includes('WITH') && upperQuery.includes('SELECT') && !fullQuery.includes(';')) {
      statementsToRun = [fullQuery];
    }
    // Otherwise split normally
    else {
      statementsToRun = splitStatements(fullQuery);
    }
  }

  statementsToRun = statementsToRun.filter(Boolean);

  if (statementsToRun.length === 0) {
    const e = [...errors]; 
    e[activeTab] = "No query to run."; 
    setErrors(e);
    setExecutionTime(null);
    return;
  }

  // Frontend guard — check all statements before running any
  for (const stmt of statementsToRun) {
    const guard = frontendGuard(stmt);
    if (guard) {
      const e = [...errors]; 
      e[activeTab] = guard; 
      setErrors(e);
      const m = [...messages]; 
      m[activeTab] = ""; 
      setMessages(m);
      setExecutionTime(null);
      return;
    }
  }

  setLoading(true);
  const e = [...errors]; 
  e[activeTab] = ""; 
  setErrors(e);
  const m = [...messages]; 
  m[activeTab] = ""; 
  setMessages(m);
  setExecutionTime(null);

  const startTime = performance.now();

  try {
    // Run all statements in parallel, each gets its own result
    const responses = await Promise.all(
      statementsToRun.map((stmt) =>
        axios
          .post(
            `${process.env.NEXT_PUBLIC_URL}/employee/SQLwindow`,
            { query: stmt, name: user?.name },
            { headers: { compcode: user?.Comp_Code } }
          )
          .then((res) => {
            // Handle both single result set and multiple result sets
            let results = [];
            
            if (Array.isArray(res.data)) {
              // Backend returned multiple result sets
              results = res.data.map((resultSet, idx) => ({
                query: idx === 0 ? stmt : `${stmt} (result set ${idx + 1})`,
                columns: resultSet.columns ?? [],
                rows: resultSet.rows ?? [],
                message: resultSet.message ?? `Returned ${resultSet.rows?.length ?? 0} row(s)`,
                error: null,
              }));
            } else {
              // Backend returned single result set
              results = [{
                query: stmt,
                columns: res.data.columns ?? [],
                rows: res.data.rows ?? [],
                message: res.data.message ?? `Returned ${res.data.rows?.length ?? 0} row(s)`,
                error: null,
              }];
            }
            
            return results;
          })
         .catch((err) => {
  return [{
    query: stmt,
    columns: [],
    rows: [],
    message: "",
    error: err.response?.data?.message || err.message || "Query failed",
    line: err.response?.data?.line,
    column: err.response?.data?.column
  }];
})
      )
    );

    const endTime = performance.now();
   setExecutionTime(((endTime - startTime) / 1000).toFixed(2));

    // Flatten the responses (each statement can return multiple result sets)
    const allResults = responses.flat();
    const nr = [...results]; 
    nr[activeTab] = allResults; 
    setResults(nr);
    
    // Optional: Show a summary message
    const totalResultSets = allResults.length;
    const totalRows = allResults.reduce((sum, r) => sum + (r.rows?.length ?? 0), 0);
    if (totalResultSets > 1) {
      const m = [...messages];
      m[activeTab] = `Executed ${statementsToRun.length} statement(s) → ${totalResultSets} result set(s) with ${totalRows} total row(s)`;
      setMessages(m);
    }
    
  } catch (err) {
    setExecutionTime(((performance.now() - startTime) / 1000).toFixed(2));
    const ne = [...errors]; 
    ne[activeTab] = "Unexpected error occurred: " + (err.message || "Unknown error"); 
    setErrors(ne);
    const nr = [...results]; 
    nr[activeTab] = []; 
    setResults(nr);
  } finally {
    setLoading(false);
  }
};

  // Ctrl+Enter shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runQuery(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, queries, editorViews]);

  // Column suggestions
  const handleQueryChange = async (index, value) => {
    const q = [...queries]; q[index] = value; setQueries(q);
    const regex = /\b(from|join)\s+([a-zA-Z0-9_]+)/gi;
    let match; const found = [];
    while ((match = regex.exec(value)) !== null)
      if (!found.includes(match[2])) found.push(match[2]);
    for (const table of found) {
      if (columnSuggestions[table]) continue;
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/employee/getTableColumns`,
          { tableName: table },
          { headers: { compcode: user?.Comp_Code } }
        );
        setColumnSuggestions((prev) => ({ ...prev, [table]: res.data }));
      } catch (_) {}
    }
  };

  // Export CSV — accepts result index for multi-result support
  const exportCSV = (resultIndex = 0) => {
    const result = results[activeTab]?.[resultIndex];
    if (!result?.columns?.length) return;
    const csv = [
      result.columns.join(","),
      ...result.rows.map((r) =>
        r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `query_${activeTab + 1}_result_${resultIndex + 1}.csv`,
    });
    a.click();
  };

  // CodeMirror theme
  const editorTheme = EditorView.theme({
    "&": {
      fontSize: "22px",
      fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
      backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
    },
    ".cm-content": { padding: "16px" },
    ".cm-gutters": {
      background: isDark ? "#252526" : "#f8fafc",
      borderRight: `1px solid ${isDark ? "#3c3c3c" : "#e2e8f0"}`,
      color: isDark ? "#858585" : "#64748b",
    },
    ".cm-activeLineGutter": { background: isDark ? "#2a2d2e" : "#f1f5f9" },
    ".cm-activeLine": { background: isDark ? "#2a2d2e80" : "#f1f5f980" },
    "&.cm-focused .cm-cursor": { borderLeftColor: isDark ? "#60a5fa" : "#4A6CF7" },
    ".cm-selectionBackground, ::selection": {
      background: isDark ? "#3b82f644" : "#bfdbfe",
    },
  });

  // Helpers for sidebar badge
  const getTabTotalRows = (tabIndex) =>
    results[tabIndex]?.reduce((sum, r) => sum + (r.rows?.length ?? 0), 0) ?? 0;

  const tabHasResults = (tabIndex) => getTabTotalRows(tabIndex) > 0;

  return (
    <main className="flex h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] overflow-hidden">

      {/* ── Modern Sidebar ── */}
      <aside className="w-64 min-w-[16rem] bg-off/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-r border-[#e2e8f0] dark:border-[#1e293b] flex flex-col py-6 px-4 gap-2 shadow-xl">
        {/* Brand Section */}
        <div className="flex items-center gap-3 px-3 pb-6 mb-2 border-b border-off dark:border-primaryop">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-primary to-b300 flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1.5 3 3 3h10c1.5 0 3-1 3-3V7c0-2-1.5-3-3-3H7c-1.5 0-3 1-3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <div>
            <p className="text-xl text-header font-bold bg-gradient-to-r from-primary to-b300 bg-clip-text text-transparent">
              Query Studio
            </p>
            <p className="text-xs text-body-color dark:text-grey">SQL Editor</p>
          </div>
        </div>

        <div className="px-3 mb-2">
          <p className="text-base font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] mb-2">
            Sessions
          </p>
          <div className="space-y-1.5">
            {Array.from({ length: TAB_COUNT }, (_, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded text-lg font-medium transition-all duration-200 group
                  ${activeTab === i
                    ? "bg-gradient-to-r from-[#4A6CF7] to-[#6366f1] text-white shadow-lg shadow-[#4A6CF7]/25"
                    : "text-[#64748b] dark:text-[#94a3b8] hover:bg-[#4A6CF7] dark:hover:bg-[#1e293b] hover:text-white dark:hover:text-white"
                  }`}
              >
                <span className={`w-7 h-7 rounded flex items-center justify-center font-mono text-sm font-bold flex-shrink-0 transition-all duration-200
                  ${activeTab === i
                    ? "bg-white/20 text-white"
                    : "bg-[#f1f5f9] dark:bg-[#1e293b] text-[#4A6CF7] dark:text-[#94a3b8] group-hover:bg-[#e2e8f0] dark:group-hover:bg-[#334155]"
                  }`}>
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-left">Query {i + 1}</span>
                {tabHasResults(i) && (
                  <span className={`text-sm px-2 py-0.5 rounded-full font-bold font-mono flex-shrink-0 transition-all duration-200
                    ${activeTab === i
                      ? "bg-white/20 text-white"
                      : "bg-[#4A6CF7]/10 text-[#4A6CF7] dark:bg-[#4A6CF7]/20 dark:text-[#93c5fd]"
                    }`}>
                    {getTabTotalRows(i) > 999 ? "999+" : getTabTotalRows(i)}
                  </span>
                )}
                {activeTab === i && (
                  <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-[#e2e8f0] dark:border-[#1e293b]">
          <div className="px-3 py-2 rounded-lg bg-[#f1f5f9] dark:bg-[#1e293b] text-center">
            <kbd className="text-base whitespace-nowrap text-header dark:text-[#94a3b8] font-mono font-semibold">
              Ctrl+Enter to run query
            </kbd>
          </div>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <section className="flex flex-col flex-1 min-w-0 overflow-hidden p-6 gap-4">
        {/* Header */}
        <header className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-b300 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl text-header font-bold bg-gradient-to-r from-[#1e293b] to-[#4A6CF7] dark:from-white dark:to-[#93c5fd] bg-clip-text text-transparent">
                SQL Query Window
              </h1>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-0">
                Active session: <span className="font-mono font-semibold text-[#4A6CF7] dark:text-[#93c5fd]">#{activeTab + 1}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {executionTime && (
              <div className="px-3 py-2.5 rounded bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-sm font-semibold shadow-lg">
                ⚡ {executionTime}s
              </div>
            )}
            {/* Export CSV only shown for first result; each result set has its own export button */}
            {results[activeTab]?.some((r) => r.columns?.length > 0) && results[activeTab]?.length === 1 && (
              <button
                onClick={() => exportCSV(0)}
                className="group relative px-5 py-2.5 rounded bg-gradient-to-r from-[#16a34a] to-[#15803d] hover:from-[#15803d] hover:to-[#16a34a] text-white text-sm font-semibold shadow-lg shadow-[#16a34a]/25 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </span>
              </button>
            )}
            <button
              onClick={runQuery}
              disabled={loading}
              className="group relative px-6 py-2.5 rounded bg-gradient-to-r from-[#4A6CF7] to-[#6366f1] hover:from-[#6366f1] hover:to-[#4A6CF7] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-[#4A6CF7]/25 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Executing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Query
                  </>
                )}
              </span>
            </button>
          </div>
        </header>

        {/* Editor */}
<div
  className="flex-shrink-0 rounded border border-[#e2e8f0] dark:border-[#1e293b] shadow-xl bg-white dark:bg-[#0f172a] resize-y overflow-auto"
  style={{
    minHeight: "100px",
    maxHeight: "700px",
    height: "320px"
  }}
>          <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] dark:from-[#1e293b] dark:to-[#0f172a] border-b border-[#e2e8f0] dark:border-[#1e293b]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                <div className="w-3 h-3 rounded-full bg-[#fbbf24]"></div>
                <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
              </div>
              <span className="ml-2 text-xs font-mono text-[#64748b] dark:text-[#94a3b8]">
                query_{activeTab + 1}.sql
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#64748b] dark:text-[#94a3b8]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="#eab308" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>SQL Mode</span>
            </div>
          </div>
          <CodeMirror
            value={queries[activeTab]}
           height="100%"
            extensions={[
              sql(),
              editorTheme,
              autocompletion({ override: [completeFromList(combinedCompletions)] }),
            ]}
            theme={isDark ? "dark" : "light"}
            onChange={(value) => handleQueryChange(activeTab, value)}
            onCreateEditor={(view) => {
              const nv = [...editorViews]; nv[activeTab] = view; setEditorViews(nv);
            }}
            placeholder="-- Write your SQL query here. Press Ctrl+Enter to execute..."
          />
        </div>

        {/* Top-level error (guard errors, empty query, etc.) */}
        {errors[activeTab] && (
          <div className="flex-shrink-0 flex items-start gap-3 px-4 py-3 rounded bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-l-4 border-[#ef4444] shadow-md">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#ef4444] flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#dc2626] dark:text-[#f87171] mb-0.5">Error</p>
              <p className="text-sm text-[#991b1b] dark:text-[#fca5a5] font-mono">{errors[activeTab]}</p>
            </div>
          </div>
        )}

        {/* ── Result Sets ── */}
        {results[activeTab]?.length > 0 ? (
          <div className="flex flex-col gap-5 flex-1 min-h-0 overflow-auto">
            {results[activeTab].map((result, idx) => (
              <div key={idx} className="flex flex-col flex-shrink-0">

                {/* Result Set Header */}
                <div className="flex items-center justify-between px-1 py-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#4A6CF7] animate-pulse"></div>
                    <span className="text-sm font-semibold text-[#1e293b] dark:text-white">
                      Result Set {idx + 1}
                    </span>
                    {result.columns.length > 0 && (
                      <span className="text-xs text-header font-mono  dark:text-[#94a3b8] bg-[#f1f5f9] dark:bg-[#1e293b] px-2 py-0.5 rounded-full border border-[#e2e8f0] dark:border-[#334155]">
                        {result.rows.length.toLocaleString()} rows · {result.columns.length} cols
                      </span>
                    )}
                    <span className="text-xs font-mono text-header dark:text-[#475569] truncate max-w-[300px]" title={result.query}>
                      {result.query.length > 60 ? result.query.slice(0, 60) + "…" : result.query}
                    </span>
                  </div>
                  {result.columns.length > 0 && (
                    <button
                      onClick={() => exportCSV(idx)}
                      className="group relative px-3 py-1.5 rounded bg-gradient-to-r from-[#16a34a] to-[#15803d] hover:from-[#15803d] hover:to-[#16a34a] text-white text-xs font-semibold shadow-md shadow-[#16a34a]/20 hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="relative flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                      </span>
                    </button>
                  )}
                </div>

                {/* Per-result error */}
                {result.error && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-l-4 border-[#ef4444] shadow-md mb-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#ef4444] flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#dc2626] dark:text-[#f87171] mb-0.5">Error</p>
                     <div
  onClick={() => jumpToError(result.line,result.column)}
  className="cursor-pointer"
>
  <p className="text-sm text-[#991b1b] dark:text-[#fca5a5] font-mono">
    {result.error}
  </p>

  {result.line && (
    <p className="text-xs text-exit mt-1">
      Line : {result.line}
    </p>
  )}
</div>
                    </div>
                  </div>
                )}

                
                

                {/* Per-result table */}
               {!result.error && (
  <PaginatedResultTable columns={result.columns} rows={result.rows} />
)}
              </div>
            ))}
          </div>
        ) : (
          !loading && !errors[activeTab] && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] dark:from-[#1e293b] dark:to-[#0f172a] border-2 border-dashed border-[#cbd5e1] dark:border-[#334155] flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#64748b] dark:text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#4A6CF7] flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs">✨</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-[#1e293b] dark:text-white mb-1">
                  Ready to query
                </p>
                <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                  Write a SQL query above and click Run
                </p>
              </div>
            </div>
          )
        )}
      </section>
    </main>
  );
};

export default SqlWindow;