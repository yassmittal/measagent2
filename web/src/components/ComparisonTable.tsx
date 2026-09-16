import type { ComparisonRow } from '@/content/comparisons';
import { formatAbsoluteDate } from '@/lib/format-date';
import { PRODUCT_NAME } from '@/lib/product';

interface ComparisonTableProps {
  competitorName: string;
  rows: ComparisonRow[];
}

/** Every claim about the other product links to where it was read, and says when. */
export function ComparisonTable({ competitorName, rows }: ComparisonTableProps) {
  return (
    <div className="comparison-table-wrap">
      <table className="comparison-table">
        <caption className="comparison-table-caption">
          {PRODUCT_NAME} and {competitorName}, feature by feature
        </caption>
        <thead>
          <tr>
            <th scope="col" className="comparison-table-head">
              Feature
            </th>
            <th scope="col" className="comparison-table-head">
              {PRODUCT_NAME}
            </th>
            <th scope="col" className="comparison-table-head">
              {competitorName}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature}>
              <th scope="row" className="comparison-table-feature">
                {row.feature}
              </th>
              <td className="comparison-table-cell">{row.ours}</td>
              <td className="comparison-table-cell">
                {row.theirs.text}{' '}
                <a
                  href={row.theirs.sourceUrl}
                  className="comparison-table-source"
                  rel="nofollow noopener"
                  target="_blank"
                >
                  Source, checked {formatAbsoluteDate(row.theirs.checkedOn)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
