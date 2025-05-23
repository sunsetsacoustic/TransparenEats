/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('barcode', 50).notNullable().unique();
    table.string('name', 255);
    table.string('brand', 255);
    table.text('ingredients_raw');
    table.jsonb('ingredients_list');
    table.jsonb('flagged_additives');
    table.jsonb('nutrition_data');
    table.string('image_url', 500);
    table.string('category', 100);
    table.string('source', 50).comment('curated, openfoodfacts, usda, nutritionix, etc.');
    table.string('status', 20).defaultTo('active').comment('active, not_found, pending_review');
    table.boolean('is_verified').defaultTo(false);
    table.integer('search_attempts').defaultTo(1);
    table.timestamp('last_searched').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.boolean('user_contributed').defaultTo(false);
  })
  .then(() => {
    return knex.raw(`
      CREATE INDEX idx_products_barcode ON products(barcode);
      CREATE INDEX idx_products_status ON products(status);
      CREATE INDEX idx_products_verified ON products(is_verified);
    `);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('products');
}; 