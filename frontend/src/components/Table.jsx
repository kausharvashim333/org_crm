function Table({ headers, children }) {
  return (
    <div className="w-full overflow-x-auto -mx-1 sm:mx-0 touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="w-full min-w-[640px] text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            {headers.map((h, i) => (
              <th key={i} className="text-left py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export const TableRow = ({ children }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    {children}
  </tr>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={`py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 ${className}`}>{children}</td>
);

export { Table };
export default Table;
