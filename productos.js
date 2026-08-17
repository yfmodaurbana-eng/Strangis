/* =====================================================
   STRANGIS — MOTOR DE PRODUCTOS + SUPABASE
   ===================================================== */

const STRANGIS_SUPABASE_URL =
    "https://xbbjfatmdbxbuoqdrgoj.supabase.co";

const STRANGIS_SUPABASE_KEY =
    "sb_publishable_M7ETdIWvj4nCQZ55i24Vpw_5Yc5Islk";

const STRANGIS_PRODUCTS_TABLE = "Products";


/* =====================================================
   CLIENTE SUPABASE
===================================================== */

const supabaseClient = {

    async request(path, options = {}) {

        const response = await fetch(
            STRANGIS_SUPABASE_URL + path,
            {
                ...options,

                headers: {
                    "apikey":
                        STRANGIS_SUPABASE_KEY,

                    "Authorization":
                        "Bearer " +
                        STRANGIS_SUPABASE_KEY,

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );

        const text =
            await response.text();

        let data = null;

        try {
            data = text
                ? JSON.parse(text)
                : null;
        } catch {
            data = text;
        }

        if (!response.ok) {

            throw new Error(
                data?.message ||
                data?.error_description ||
                text ||
                `Error HTTP ${response.status}`
            );
        }

        return data;
    },


    from(table) {

        return {

            async insert(product) {

                return {
                    data:
                        await supabaseClient.request(
                            `/rest/v1/${table}`,
                            {
                                method: "POST",

                                headers: {
                                    "Prefer":
                                        "return=representation"
                                },

                                body:
                                    JSON.stringify(product)
                            }
                        ),

                    error: null
                };

            },

            async select() {

                try {

                    const data =
                        await supabaseClient.request(
                            `/rest/v1/${table}?select=*`
                        );

                    return {
                        data,
                        error: null
                    };

                } catch(error) {

                    return {
                        data: null,
                        error
                    };

                }

            }

        };

    }

};


/* =====================================================
   PRODUCTOS LOCALES
=====================================================

   IMPORTANTE:

   Ya NO guardamos aquí los productos de la tienda.

   Los productos reales están en:

       Supabase → Products

===================================================== */

const STRANGIS_PRODUCTS = [];


/* =====================================================
   FUNCIONES COMPATIBLES
===================================================== */

function getProducts() {

    return STRANGIS_PRODUCTS;

}


function getProductsByCategory(category) {

    return STRANGIS_PRODUCTS.filter(
        product =>
            String(product.category || "")
                .toLowerCase()
            ===
            String(category || "")
                .toLowerCase()
    );

}


function getProductById(id) {

    return STRANGIS_PRODUCTS.find(
        product =>
            String(product.id)
            ===
            String(id)
    );

}


function getProductByReference(ref) {

    return STRANGIS_PRODUCTS.find(
        product =>
            String(product.ref)
            ===
            String(ref)
    );

}


function getCategoryName(category) {

    const names = {

        camisetas:
            "Camisetas",

        pantalones:
            "Pantalones",

        conjuntos:
            "Conjuntos",

        gorras:
            "Gorras",

        gafas:
            "Gafas",

        bisuteria:
            "Bisutería"

    };

    return (
        names[
            String(category || "")
                .toLowerCase()
        ]
        ||
        category
    );

}


/* =====================================================
   GUARDAR PRODUCTO EN SUPABASE
===================================================== */

async function saveProductToSupabase() {

    try {

        const nameElement =
            document.getElementById(
                "productName"
            );

        const refElement =
            document.getElementById(
                "productRef"
            );

        const priceElement =
            document.getElementById(
                "productPrice"
            );

        const stockElement =
            document.getElementById(
                "productStock"
            );

        const descriptionElement =
            document.getElementById(
                "productDescription"
            );

        const whatsappElement =
            document.getElementById(
                "productWhatsapp"
            );

        const shippingMinElement =
            document.getElementById(
                "shippingMin"
            );

        const shippingMaxElement =
            document.getElementById(
                "shippingMax"
            );


        if (!nameElement) {

            alert(
                "No se encontró el campo del nombre del producto."
            );

            return;
        }


        const name =
            nameElement.value.trim();

        const ref =
            refElement
                ? refElement.value.trim()
                : "";

        const price =
            priceElement
                ? Number(priceElement.value) || 0
                : 0;

        const stock =
            stockElement
                ? Number(stockElement.value) || 0
                : 0;

        const description =
            descriptionElement
                ? descriptionElement.value.trim()
                : "";

        const whatsapp =
            whatsappElement
                ? whatsappElement.value
                    .replace(/\D/g, "")
                : "";

        const shippingMin =
            shippingMinElement
                ? Number(
                    shippingMinElement.value
                  ) || 3
                : 3;

        const shippingMax =
            shippingMaxElement
                ? Number(
                    shippingMaxElement.value
                  ) || 9
                : 9;


        /* =========================================
           CATEGORÍA
        ========================================= */

        const categoryElement =
            document.getElementById(
                "productCategory"
            );

        const category =
            categoryElement
                ? categoryElement.value.trim().toLowerCase()
                : "camisetas";


        const allowedCategories = [

            "camisetas",
            "pantalones",
            "conjuntos",
            "gorras",
            "gafas",
            "bisuteria"

        ];


        if (
            !allowedCategories.includes(
                category
            )
        ) {

            alert(
                "Selecciona una categoría válida."
            );

            return;
        }


        /* =========================================
           VALIDACIONES
        ========================================= */

        if (!name) {

            alert(
                "Introduce el nombre del producto."
            );

            return;
        }


        if (!ref) {

            alert(
                "Introduce la referencia / ID."
            );

            return;
        }


        /* =========================================
           VARIANTES
        =========================================

           Aceptamos la variable global:

               variants

           que ya utiliza tu panel.

           Se guardan en la columna:

               images

        ========================================= */

        const sourceVariants =
            Array.isArray(window.variants)
                ? window.variants
                : (
                    typeof variants !== "undefined"
                        ? variants
                        : []
                  );


        const validVariants =
            sourceVariants
                .map(
                    variant => ({

                        name:
                            String(
                                variant.name || ""
                            ).trim(),

                        image:
                            String(
                                variant.image || ""
                            ).trim()

                    })
                )
                .filter(
                    variant =>
                        variant.name ||
                        variant.image
                );


        if (!validVariants.length) {

            alert(
                "Añade al menos un color con su imagen."
            );

            return;
        }


        for (
            const variant
            of validVariants
        ) {

            if (!variant.name) {

                alert(
                    "Todos los colores deben tener nombre."
                );

                return;
            }


            if (!variant.image) {

                alert(
                    "Todos los colores deben tener una URL de imagen."
                );

                return;
            }

        }


        /* =========================================
           TALLAS
        ========================================= */

        const sourceSizes =
            Array.isArray(window.sizes)
                ? window.sizes
                : (
                    typeof sizes !== "undefined"
                        ? sizes
                        : []
                  );


        const validSizes =
            sourceSizes
                .map(
                    size =>
                        String(size)
                            .trim()
                )
                .filter(Boolean);


        /* =========================================
           PRODUCTO PARA SUPABASE
        ========================================= */

        const product = {

            name,

            category,

            ref,

            price,

            stock,

            description,

            whatsapp,

            images:
                validVariants,

            sizes:
                validSizes,

            shipping_min:
                shippingMin,

            shipping_max:
                shippingMax,

            active:
                true

        };


        console.log(
            "Producto que se enviará a Supabase:",
            product
        );


        /* =========================================
           INSERTAR
        ========================================= */

        const result =
            await supabaseClient
                .from(
                    STRANGIS_PRODUCTS_TABLE
                )
                .insert(product);


        if (result.error) {

            console.error(
                result.error
            );

            alert(
                "Error al guardar el producto:\n\n" +
                result.error.message
            );

            return;
        }


        alert(
            "✅ Producto guardado correctamente en Supabase."
        );


        /* =========================================
           LIMPIAR / GENERAR CÓDIGO
        ========================================= */

        if (
            typeof generateCode ===
            "function"
        ) {

            generateCode();

        }

    }

    catch(error) {

        console.error(
            "Error guardando producto:",
            error
        );


        alert(
            "❌ No se pudo guardar el producto:\n\n" +
            error.message
        );

    }

}


/* =====================================================
   EXPORTACIÓN GLOBAL
===================================================== */

window.STRANGIS_PRODUCTS =
    STRANGIS_PRODUCTS;

window.getProducts =
    getProducts;

window.getProductsByCategory =
    getProductsByCategory;

window.getProductById =
    getProductById;

window.getProductByReference =
    getProductByReference;

window.getCategoryName =
    getCategoryName;

window.saveProductToSupabase =
    saveProductToSupabase;

window.supabaseClient =
    supabaseClient;
