function schemaToString(schema) {
  let str = "";
  schema.tables.forEach((table) => {
    str += `Table ${table}:\n`;
    schema.columns
      .filter((col) => col.table_name === table)
      .forEach((col) => {
        str += `  - ${col.column_name} (${col.data_type})\n`;
      });
  });
  return str;
}
module.exports = { schemaToString };
