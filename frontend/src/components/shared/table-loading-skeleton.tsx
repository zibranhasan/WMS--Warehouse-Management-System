interface TableLoadingSkeletonProps {
  columnCount?: number;
  rowCount?: number;
}

export function TableLoadingSkeleton({
  columnCount = 5,
  rowCount = 5,
}: TableLoadingSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <tr>
            {Array.from({ length: columnCount }).map((_, i) => (
              <th key={i} className="px-5 py-3.5">
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <td key={colIndex} className="px-5 py-4">
                  <div
                    className="h-4 rounded bg-slate-100 dark:bg-slate-900 animate-pulse"
                    style={{
                      width: `${60 + ((colIndex * 17 + rowIndex * 13) % 35)}%`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
