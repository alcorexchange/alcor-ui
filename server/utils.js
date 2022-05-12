//import config from '../config'
// TODO
//export const fetchAllRows = (network: NetworkName) => async <T>(
//  options: GetTableRowsOptions,
//  indexName = `id`
//): Promise<T[]> => {
//  const rpc = getRpc(network);
//  const mergedOptions = {
//    json: true,
//    lower_bound: 0,
//    upper_bound: undefined,
//    limit: 9999,
//    ...options,
//  };
//
//  let rows: T[] = [];
//  let lowerBound = mergedOptions.lower_bound;
//
//  /* eslint-disable no-await-in-loop */
//  for (let i = 0; i < MAX_PAGINATION_FETCHES; i += 1) {
//    const result = await rpc.get_table_rows({
//      ...mergedOptions,
//      lower_bound: lowerBound,
//    });
//    rows = rows.concat(result.rows);
//
//    if (!result.more || result.rows.length === 0) break;
//
//    // EOS 2.0 api
//    if (typeof result.next_key !== `undefined`) {
//      lowerBound = result.next_key;
//    } else {
//      lowerBound =
//        Number.parseInt(
//          `${result.rows[result.rows.length - 1][indexName]}`,
//          10
//        ) + 1;
//    }
//  }
//
//  return rows;
//};

//export const fetchAllScopes = (network: NetworkName) => async (
//  contract: string,
//  table: string
//): Promise<string[]> => {
//  const rpc = getRpc(network);
//  const mergedOptions = {
//    json: true,
//    lower_bound: undefined,
//    upper_bound: undefined,
//    limit: 9999,
//    code: contract,
//    table,
//  };
//  const rows = (await rpc.get_table_by_scope(mergedOptions))
//    .rows as ScopeResult[];
//  return rows.map((row) => row.scope);
//};
