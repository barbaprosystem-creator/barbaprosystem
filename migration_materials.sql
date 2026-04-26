    -- =========================================================================
    -- SISTEMA DE MATERIALES Y ÓRDENES DE COMPRA (BOM - BILL OF MATERIALS)
    -- =========================================================================

    -- 1. Catálogo Maestro de Materiales (La ferretería interna)
    CREATE TABLE IF NOT EXISTS public.materials_catalog (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL, -- Ej. "Quikrete 80lb"
        category VARCHAR(100) NOT NULL, -- Ej. "Concrete", "Wood", "Roofing", "Fencing"
        unit_of_measure VARCHAR(50) NOT NULL, -- Ej. "Bag", "Piece", "Bundle", "Box", "Roll"
        estimated_price DECIMAL(10,2) DEFAULT 0.00,
        store_url TEXT, -- Link a Menards o Home Depot
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 2. Fórmulas de Servicio (Las "Recetas" que el Admin controla al milímetro)
    -- Aquí es donde Barba puede ajustar cómo se calcula todo.
    CREATE TABLE IF NOT EXISTS public.service_material_recipes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        service_type VARCHAR(100) NOT NULL, -- Ej. "roofing_shingles", "fencing_wood_privacy"
        material_id UUID REFERENCES public.materials_catalog(id) ON DELETE CASCADE,
        calculation_variable VARCHAR(50) NOT NULL, -- Qué variable usa: "squares", "linear_feet", "posts_count"
        coverage_per_unit DECIMAL(10,4) NOT NULL, -- Ej. 1 bolsa de cemento cubre 0.5 postes. 1 Bundle cubre 0.33 Squares.
        waste_factor_percent DECIMAL(5,2) DEFAULT 0.00, -- Ej. 10.00 = 10% desperdicio (cortes)
        is_required BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 3. Órdenes de Compra (Purchase Orders) por Proyecto
    CREATE TABLE IF NOT EXISTS public.material_orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL, -- Referencia al ID del lead o estimado
        status VARCHAR(50) DEFAULT 'draft', -- draft, approved, ordered, delivered
        total_estimated_cost DECIMAL(12,2) DEFAULT 0.00,
        created_by UUID, -- Quien lo generó
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 4. Ítems exactos dentro de la Orden de Compra (Las cantidades finales a pedir)
    CREATE TABLE IF NOT EXISTS public.material_order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID REFERENCES public.material_orders(id) ON DELETE CASCADE,
        material_id UUID REFERENCES public.materials_catalog(id),
        calculated_quantity DECIMAL(10,2) NOT NULL, -- Lo que dijo la fórmula matemática (Ej. 12.3 bolsas)
        manual_adjustment DECIMAL(10,2) DEFAULT 0.00, -- Lo que ajusta el admin (Ej. añade +0.7 para redondear a 13)
        final_quantity DECIMAL(10,2) NOT NULL, -- Ej. 13.0 bolsas (Lo que se pide a la tienda)
        unit_price DECIMAL(10,2) NOT NULL, -- Precio congelado en el momento de crear la orden
        total_price DECIMAL(10,2) NOT NULL,
        notes TEXT
    );

    -- Habilitar RLS (Seguridad)
    ALTER TABLE public.materials_catalog ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.service_material_recipes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.material_orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.material_order_items ENABLE ROW LEVEL SECURITY;

    -- Políticas temporales para desarrollo (Luego se restringen al admin)
    CREATE POLICY "Allow all actions on materials_catalog" ON public.materials_catalog FOR ALL USING (true);
    CREATE POLICY "Allow all actions on service_material_recipes" ON public.service_material_recipes FOR ALL USING (true);
    CREATE POLICY "Allow all actions on material_orders" ON public.material_orders FOR ALL USING (true);
    CREATE POLICY "Allow all actions on material_order_items" ON public.material_order_items FOR ALL USING (true);
