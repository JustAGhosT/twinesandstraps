-- CreateIndex
CREATE INDEX "Order_user_id_idx" ON "Order"("user_id");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_payment_status_idx" ON "Order"("payment_status");

-- CreateIndex
CREATE INDEX "Order_created_at_idx" ON "Order"("created_at");

-- CreateIndex
CREATE INDEX "Order_order_number_idx" ON "Order"("order_number");

-- CreateIndex
CREATE INDEX "Product_category_id_idx" ON "Product"("category_id");

-- CreateIndex
CREATE INDEX "Product_stock_status_idx" ON "Product"("stock_status");

-- CreateIndex
CREATE INDEX "Product_created_at_idx" ON "Product"("created_at");

-- CreateIndex
CREATE INDEX "Product_supplier_id_idx" ON "Product"("supplier_id");
