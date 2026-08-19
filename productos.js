/* =====================================================
   STRANGIS — PRODUCTS.JS
   MOTOR DE PRODUCTOS + SUPABASE
   ===================================================== */

const STRANGIS_SUPABASE_URL =
    "https://xbbjfatmdbxbuoqdrgoj.supabase.co";

const STRANGIS_SUPABASE_KEY =
    "sb_publishable_M7ETdIWvj4nCQZ55i24Vpw_5Yc5Islk";

const STRANGIS_PRODUCTS_TABLE =
    "Products";


/* =====================================================
   CONFIGURACIÓN GENERAL
===================================================== */

const STRANGIS_ALLOWED_CATEGORIES = [
    "camisetas",
    "pantalones",
    "conjuntos",
    "gorras",
    "gafas",
    "bisuteria"
];


const STRANGIS_CATEGORY_NAMES = {
    camisetas: "Camisetas",
    pantalones: "Pantalones",
    conjuntos: "Conjuntos",
    gorras: "Gorras",
    gafas: "Gafas",
    bisuteria: "Bisutería"
};


/* =====================================================
   PRODUCTOS EN MEMORIA
===================================================== */

const STRANGIS_PRODUCTS = [];


/* =====================================================
   UTILIDADES
===================================================== */

function strangisString(value) {

    return String(
        value ?? ""
    ).trim();

}


function strangisNormalizeCategory(category) {

    return strangisString(
        category
    ).toLowerCase();

}


function strangisNumber(
    value,
    fallback = 0
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return fallback;

    }

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;

}


function strangisPositiveInteger(
    value,
    fallback = 0
) {

    const number =
        strangisNumber(
            value,
            fallback
        );

    return Math.max(
        0,
        Math.floor(number)
    );

}


function strangisParseJSON(value) {

    if (
        typeof value !== "string"
    ) {

        return value;

    }

    const text =
        value.trim();

    if (!text) {

        return value;

    }

    try {

        return JSON.parse(text);

    }
    catch {

        return value;

    }

}


/* =====================================================
   NORMALIZAR UNA IMAGEN
=====================================================

   Admite:

   "https://..."

   {
       "name": "Negro",
       "image": "https://..."
   }

   {
       "name": "Negro",
       "url": "https://..."
   }

   {
       "name": "Negro",
       "src": "https://..."
   }
===================================================== */

function normalizeProductImage(item) {

    if (
        typeof item === "string"
    ) {

        const image =
            item.trim();

        if (!image) {

            return null;

        }

        return {
            name: "",
            image: image
        };

    }


    if (
        !item ||
        typeof item !== "object"
    ) {

        return null;

    }


    const image =
        strangisString(
            item.image ||
            item.url ||
            item.src ||
            item.image_url ||
            item.imageUrl ||
            item.photo ||
            item.photo_url ||
            item.photoUrl
        );


    const name =
        strangisString(
            item.name ||
            item.color ||
            item.colour ||
            item.variant
        );


    if (!image) {

        return null;

    }


    return {
        name: name,
        image: image
    };

}


/* =====================================================
   NORMALIZAR LISTA DE IMÁGENES
===================================================== */

function normalizeProductImages(value) {

    let raw =
        strangisParseJSON(
            value
        );


    /*
     * Si no existe nada
     */

    if (
        raw === null ||
        raw === undefined ||
        raw === ""
    ) {

        return [];

    }


    /*
     * Caso:

     * {
     *     name: "Negro",
     *     image: "https://..."
     * }
     */

    if (
        raw &&
        typeof raw === "object" &&
        !Array.isArray(raw)
    ) {

        const normalized =
            normalizeProductImage(
                raw
            );

        return normalized
            ? [normalized]
            : [];

    }


    /*
     * Caso:

     * "https://..."
     */

    if (
        typeof raw === "string"
    ) {

        const normalized =
            normalizeProductImage(
                raw
            );

        return normalized
            ? [normalized]
            : [];

    }


    /*
     * Caso:

     * [
     *     "https://...",
     *     "https://..."
     * ]
     *
     * o:
     *
     * [
     *     {
     *         name: "Negro",
     *         image: "https://..."
     *     }
     * ]
     */

    if (
        Array.isArray(raw)
    ) {

        return raw

            .map(
                item =>
                    normalizeProductImage(
                        item
                    )
            )

            .filter(Boolean);

    }


    return [];

}


/* =====================================================
   CLIENTE SUPABASE
===================================================== */

const supabaseClient = {

    async request(
        path,
        options = {}
    ) {

        const url =
            STRANGIS_SUPABASE_URL +
            path;


        const headers = {

            "apikey":
                STRANGIS_SUPABASE_KEY,

            "Authorization":
                "Bearer " +
                STRANGIS_SUPABASE_KEY,

            "Content-Type":
                "application/json",

            ...(options.headers || {})

        };


        let response;


        try {

            response =
                await fetch(
                    url,
                    {
                        ...options,
                        headers
                    }
                );

        }
        catch (error) {

            throw new Error(
                "No se pudo conectar con Supabase. " +
                (
                    error?.message ||
                    "Comprueba tu conexión a Internet."
                )
            );

        }


        const text =
            await response.text();


        let data = null;


        if (text) {

            try {

                data =
                    JSON.parse(text);

            }
            catch {

                data =
                    text;

            }

        }


        if (!response.ok) {

            const errorMessage =

                data?.message ||

                data?.error_description ||

                data?.details ||

                data?.hint ||

                (
                    typeof data === "string"
                        ? data
                        : ""
                ) ||

                `Error HTTP ${response.status}`;


            const error =
                new Error(
                    errorMessage
                );


            error.status =
                response.status;

            error.code =
                data?.code || null;

            error.details =
                data?.details || null;

            error.hint =
                data?.hint || null;


            throw error;

        }


        return data;

    },


    from(table) {

        const encodedTable =
            encodeURIComponent(
                table
            );


        return {

            async insert(product) {

                try {

                    const data =
                        await supabaseClient.request(

                            `/rest/v1/${encodedTable}`,

                            {
                                method: "POST",

                                headers: {
                                    "Prefer":
                                        "return=representation"
                                },

                                body:
                                    JSON.stringify(
                                        product
                                    )
                            }

                        );


                    return {
                        data,
                        error: null
                    };

                }
                catch (error) {

                    return {
                        data: null,
                        error
                    };

                }

            },


            async select() {

                try {

                    const data =
                        await supabaseClient.request(

                            `/rest/v1/${encodedTable}?select=*`

                        );


                    return {
                        data,
                        error: null
                    };

                }
                catch (error) {

                    return {
                        data: null,
                        error
                    };

                }

            },


            async selectWhere(
                column,
                operator,
                value
            ) {

                try {

                    const encodedColumn =
                        encodeURIComponent(
                            column
                        );

                    const encodedValue =
                        encodeURIComponent(
                            value
                        );


                    const data =
                        await supabaseClient.request(

                            `/rest/v1/${encodedTable}` +
                            `?select=*` +
                            `&${encodedColumn}=` +
                            `${operator}.${encodedValue}`

                        );


                    return {
                        data,
                        error: null
                    };

                }
                catch (error) {

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
   NORMALIZAR PRODUCTO
===================================================== */

function normalizeProduct(product) {

    if (
        !product ||
        typeof product !== "object"
    ) {

        return null;

    }


    const normalized = {
        ...product
    };


    normalized.name =
        strangisString(
            product.name
        );


    normalized.category =
        strangisNormalizeCategory(
            product.category
        );


    normalized.ref =
        strangisString(
            product.ref
        );


    normalized.price =
        strangisNumber(
            product.price,
            0
        );


    normalized.stock =
        strangisPositiveInteger(
            product.stock,
            0
        );


    normalized.description =
        strangisString(
            product.description
        );


    normalized.whatsapp =
        strangisString(
            product.whatsapp
        );


    normalized.shipping_min =
        strangisNumber(
            product.shipping_min,
            3
        );


    normalized.shipping_max =
        strangisNumber(
            product.shipping_max,
            9
        );


    normalized.active =
        product.active !== false;


    /* =============================================
       IMÁGENES
    ============================================= */

    normalized.images =
        normalizeProductImages(
            product.images
        );


    /*
     * Compatibilidad adicional:
     *
     * Si la tabla tiene "image"
     * en vez de "images".
     */

    if (
        !normalized.images.length &&
        product.image
    ) {

        normalized.images =
            normalizeProductImages(
                product.image
            );

    }


    /*
     * Compatibilidad adicional:
     *
     * image_url
     */

    if (
        !normalized.images.length &&
        product.image_url
    ) {

        normalized.images =
            normalizeProductImages(
                product.image_url
            );

    }


    /* =============================================
       TALLAS
    ============================================= */

    const rawSizes =
        strangisParseJSON(
            product.sizes
        );


    if (
        Array.isArray(rawSizes)
    ) {

        normalized.sizes =
            rawSizes

                .map(
                    size =>
                        strangisString(
                            size
                        )
                )

                .filter(Boolean);

    }
    else if (
        typeof rawSizes === "string" &&
        rawSizes.trim()
    ) {

        normalized.sizes =
            rawSizes

                .split(",")

                .map(
                    size =>
                        strangisString(
                            size
                        )
                )

                .filter(Boolean);

    }
    else {

        normalized.sizes = [];

    }


    /*
     * DEBUG IMPORTANTE
     */

    console.log(
        "STRANGIS — producto normalizado:",
        {
            name:
                normalized.name,

            ref:
                normalized.ref,

            images:
                normalized.images
        }
    );


    return normalized;

}


/* =====================================================
   CARGAR PRODUCTOS DESDE SUPABASE
===================================================== */

async function loadProductsFromSupabase() {

    console.log(
        "STRANGIS — cargando productos desde Supabase..."
    );


    const result =
        await supabaseClient
            .from(
                STRANGIS_PRODUCTS_TABLE
            )
            .select();


    if (result.error) {

        console.error(
            "STRANGIS — error Supabase:",
            result.error
        );

        throw result.error;

    }


    const products =
        Array.isArray(result.data)
            ? result.data
            : [];


    /*
     * DEBUG:
     * mostramos exactamente lo que
     * devuelve Supabase.
     */

    console.log(
        "STRANGIS — RESPUESTA ORIGINAL DE SUPABASE:",
        products
    );


    STRANGIS_PRODUCTS.length = 0;


    products.forEach(
        product => {

            const normalized =
                normalizeProduct(
                    product
                );


            if (normalized) {

                STRANGIS_PRODUCTS.push(
                    normalized
                );

            }

        }
    );


    console.log(
        `STRANGIS — ${STRANGIS_PRODUCTS.length} productos cargados.`,
        STRANGIS_PRODUCTS
    );


    return STRANGIS_PRODUCTS;

}


/* =====================================================
   OBTENER PRODUCTOS
===================================================== */

function getProducts() {

    return STRANGIS_PRODUCTS;

}


function getActiveProducts() {

    return STRANGIS_PRODUCTS.filter(
        product =>
            product?.active !== false
    );

}


/* =====================================================
   PRODUCTOS POR CATEGORÍA
===================================================== */

function getProductsByCategory(
    category
) {

    const wantedCategory =
        strangisNormalizeCategory(
            category
        );


    return STRANGIS_PRODUCTS.filter(
        product =>
            strangisNormalizeCategory(
                product?.category
            ) === wantedCategory
    );

}


function getActiveProductsByCategory(
    category
) {

    const wantedCategory =
        strangisNormalizeCategory(
            category
        );


    return STRANGIS_PRODUCTS.filter(
        product => {

            if (
                product?.active === false
            ) {

                return false;

            }


            return (
                strangisNormalizeCategory(
                    product?.category
                ) === wantedCategory
            );

        }
    );

}


/* =====================================================
   PRODUCTO POR ID
===================================================== */

function getProductById(id) {

    if (
        id === null ||
        id === undefined
    ) {

        return undefined;

    }


    const wantedId =
        String(id);


    return STRANGIS_PRODUCTS.find(
        product =>
            String(product?.id) ===
            wantedId
    );

}


/* =====================================================
   PRODUCTO POR REFERENCIA
===================================================== */

function getProductByReference(
    ref
) {

    const wantedRef =
        strangisString(
            ref
        ).toLowerCase();


    if (!wantedRef) {

        return undefined;

    }


    return STRANGIS_PRODUCTS.find(
        product =>
            strangisString(
                product?.ref
            ).toLowerCase() ===
            wantedRef
    );

}


function productReferenceExists(
    ref
) {

    return Boolean(
        getProductByReference(
            ref
        )
    );

}


/* =====================================================
   NOMBRE DE CATEGORÍA
===================================================== */

function getCategoryName(
    category
) {

    const key =
        strangisNormalizeCategory(
            category
        );


    return (
        STRANGIS_CATEGORY_NAMES[key] ||
        strangisString(category)
    );

}


/* =====================================================
   IMÁGENES DEL PRODUCTO
===================================================== */

function getProductImages(
    product
) {

    if (!product) {

        return [];

    }


    /*
     * Si el producto ya está normalizado,
     * usamos directamente normalized.images.
     */

    if (
        Array.isArray(
            product.images
        )
    ) {

        return product.images

            .map(
                item => {

                    if (
                        typeof item === "string"
                    ) {

                        return item.trim();

                    }


                    if (
                        item &&
                        typeof item === "object"
                    ) {

                        return strangisString(
                            item.image ||
                            item.url ||
                            item.src
                        );

                    }


                    return "";

                }
            )

            .filter(Boolean);

    }


    /*
     * Fallback para productos no normalizados.
     */

    return normalizeProductImages(
        product.images
    )
        .map(
            item =>
                item.image
        )
        .filter(Boolean);

}


/* =====================================================
   PRIMERA IMAGEN
===================================================== */

function getProductImage(
    product
) {

    const images =
        getProductImages(
            product
        );


    return images[0] || "";

}


/* =====================================================
   VARIANTES
===================================================== */

function getProductVariants(
    product
) {

    if (!product) {

        return [];

    }


    /*
     * Si ya está normalizado,
     * product.images contiene objetos
     * { name, image }.
     */

    if (
        Array.isArray(
            product.images
        )
    ) {

        return product.images

            .map(
                variant => {

                    if (
                        typeof variant ===
                        "string"
                    ) {

                        return {

                            name: "",

                            image:
                                variant.trim()

                        };

                    }


                    if (
                        variant &&
                        typeof variant ===
                        "object"
                    ) {

                        return {

                            name:
                                strangisString(
                                    variant.name
                                ),

                            image:
                                strangisString(
                                    variant.image ||
                                    variant.url ||
                                    variant.src
                                )

                        };

                    }


                    return {

                        name: "",

                        image: ""

                    };

                }
            )

            .filter(
                variant =>
                    variant.name ||
                    variant.image
            );

    }


    return [];

}


/* =====================================================
   TALLAS
===================================================== */

function getProductSizes(
    product
) {

    if (!product) {

        return [];

    }


    if (
        Array.isArray(
            product.sizes
        )
    ) {

        return product.sizes

            .map(
                size =>
                    strangisString(
                        size
                    )
            )

            .filter(Boolean);

    }


    const sizes =
        strangisParseJSON(
            product.sizes
        );


    if (
        Array.isArray(sizes)
    ) {

        return sizes

            .map(
                size =>
                    strangisString(
                        size
                    )
            )

            .filter(Boolean);

    }


    if (
        typeof sizes ===
        "string"
    ) {

        return sizes

            .split(",")

            .map(
                size =>
                    strangisString(
                        size
                    )
            )

            .filter(Boolean);

    }


    return [];

}


/* =====================================================
   VALIDAR CATEGORÍA
===================================================== */

function isValidProductCategory(
    category
) {

    return STRANGIS_ALLOWED_CATEGORIES.includes(
        strangisNormalizeCategory(
            category
        )
    );

}


/* =====================================================
   VALORES DEL FORMULARIO
===================================================== */

function getProductFormValues() {

    const getValue =
        id => {

            const element =
                document.getElementById(
                    id
                );


            return element
                ? element.value
                : "";

        };


    return {

        name:
            strangisString(
                getValue(
                    "productName"
                )
            ),

        ref:
            strangisString(
                getValue(
                    "productRef"
                )
            ),

        price:
            strangisNumber(
                getValue(
                    "productPrice"
                ),
                0
            ),

        stock:
            strangisPositiveInteger(
                getValue(
                    "productStock"
                ),
                0
            ),

        description:
            strangisString(
                getValue(
                    "productDescription"
                )
            ),

        whatsapp:
            strangisString(
                getValue(
                    "productWhatsapp"
                )
            )
            .replace(
                /\D/g,
                ""
            ),

        shippingMin:
            strangisNumber(
                getValue(
                    "shippingMin"
                ),
                3
            ),

        shippingMax:
            strangisNumber(
                getValue(
                    "shippingMax"
                ),
                9
            ),

        category:
            strangisNormalizeCategory(
                getValue(
                    "productCategory"
                ) ||
                "camisetas"
            )

    };

}


/* =====================================================
   VARIANTES DEL FORMULARIO
===================================================== */

function getFormVariants() {

    const sourceVariants =
        Array.isArray(
            window.variants
        )
            ? window.variants
            : [];


    return sourceVariants

        .map(
            variant => ({

                name:
                    strangisString(
                        variant?.name
                    ),

                image:
                    strangisString(
                        variant?.image ||
                        variant?.url ||
                        variant?.src
                    )

            })
        )

        .filter(
            variant =>
                variant.name ||
                variant.image
        );

}


/* =====================================================
   TALLAS DEL FORMULARIO
===================================================== */

function getFormSizes() {

    const sourceSizes =
        Array.isArray(
            window.sizes
        )
            ? window.sizes
            : [];


    return sourceSizes

        .map(
            size =>
                strangisString(
                    size
                )
        )

        .filter(Boolean);

}


/* =====================================================
   VALIDAR VARIANTES
===================================================== */

function validateProductVariants(
    variants
) {

    if (
        !Array.isArray(variants) ||
        !variants.length
    ) {

        return {

            valid: false,

            message:
                "Añade al menos un color con su imagen."

        };

    }


    for (
        const variant of variants
    ) {

        if (!variant.name) {

            return {

                valid: false,

                message:
                    "Todos los colores deben tener nombre."

            };

        }


        if (!variant.image) {

            return {

                valid: false,

                message:
                    "Todos los colores deben tener una URL de imagen."

            };

        }

    }


    return {

        valid: true,

        message: ""

    };

}


/* =====================================================
   VALIDAR PRODUCTO
===================================================== */

function validateProductData(
    data,
    variants
) {

    if (!data.name) {

        return {

            valid: false,

            message:
                "Introduce el nombre del producto."

        };

    }


    if (!data.ref) {

        return {

            valid: false,

            message:
                "Introduce la referencia / ID."

        };

    }


    if (
        !isValidProductCategory(
            data.category
        )
    ) {

        return {

            valid: false,

            message:
                "Selecciona una categoría válida."

        };

    }


    if (
        data.price < 0
    ) {

        return {

            valid: false,

            message:
                "El precio no puede ser negativo."

        };

    }


    if (
        data.stock < 0
    ) {

        return {

            valid: false,

            message:
                "El stock no puede ser negativo."

        };

    }


    if (
        data.shippingMin < 0 ||
        data.shippingMax < 0
    ) {

        return {

            valid: false,

            message:
                "Los gastos de envío no pueden ser negativos."

        };

    }


    if (
        data.shippingMin >
        data.shippingMax
    ) {

        return {

            valid: false,

            message:
                "El envío mínimo no puede ser superior al máximo."

        };

    }


    const variantsResult =
        validateProductVariants(
            variants
        );


    if (
        !variantsResult.valid
    ) {

        return variantsResult;

    }


    return {

        valid: true,

        message: ""

    };

}


/* =====================================================
   CREAR PRODUCTO DESDE FORMULARIO
===================================================== */

function buildProductFromForm() {

    const data =
        getProductFormValues();


    const variants =
        getFormVariants();


    const sizes =
        getFormSizes();


    const validation =
        validateProductData(
            data,
            variants
        );


    if (
        !validation.valid
    ) {

        return {

            product: null,

            error:
                validation.message

        };

    }


    const product = {

        name:
            data.name,

        category:
            data.category,

        ref:
            data.ref,

        price:
            data.price,

        stock:
            data.stock,

        description:
            data.description,

        whatsapp:
            data.whatsapp,

        /*
         * IMPORTANTE:
         *
         * Guardamos las variantes
         * como objetos:
         *
         * [
         *   {
         *      name: "Negro",
         *      image: "https://..."
         *   }
         * ]
         */

        images:
            variants,

        sizes:
            sizes,

        shipping_min:
            data.shippingMin,

        shipping_max:
            data.shippingMax,

        active:
            true

    };


    return {

        product,

        error: null

    };

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


        if (!nameElement) {

            alert(
                "No se encontró el campo del nombre del producto."
            );

            return null;

        }


        const built =
            buildProductFromForm();


        if (built.error) {

            alert(
                built.error
            );

            return null;

        }


        const product =
            built.product;


        const existingProduct =
            getProductByReference(
                product.ref
            );


        if (existingProduct) {

            const shouldContinue =
                window.confirm(

                    "Ya existe un producto en memoria " +
                    `con la referencia "${product.ref}".\n\n` +
                    "¿Quieres continuar de todos modos?"

                );


            if (!shouldContinue) {

                return null;

            }

        }


        console.log(
            "STRANGIS — producto a guardar:",
            product
        );


        const result =
            await supabaseClient

                .from(
                    STRANGIS_PRODUCTS_TABLE
                )

                .insert(
                    product
                );


        if (result.error) {

            console.error(
                "STRANGIS — error guardando:",
                result.error
            );


            let message =
                result.error.message ||
                "Error desconocido.";


            if (
                result.error.code ===
                "23505"
            ) {

                message =
                    "La referencia del producto ya existe.";

            }


            alert(
                "❌ No se pudo guardar el producto:\n\n" +
                message
            );


            return null;

        }


        const savedProducts =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        savedProducts.forEach(
            savedProduct => {

                const normalized =
                    normalizeProduct(
                        savedProduct
                    );


                if (!normalized) {

                    return;

                }


                const existingIndex =
                    normalized.id !== undefined &&
                    normalized.id !== null

                        ? STRANGIS_PRODUCTS.findIndex(
                            item =>
                                String(
                                    item?.id
                                ) ===
                                String(
                                    normalized.id
                                )
                        )

                        : -1;


                if (
                    existingIndex >= 0
                ) {

                    STRANGIS_PRODUCTS[
                        existingIndex
                    ] =
                        normalized;

                }
                else {

                    STRANGIS_PRODUCTS.push(
                        normalized
                    );

                }

            }
        );


        alert(
            "✅ Producto guardado correctamente en Supabase."
        );


        if (
            typeof window.generateCode ===
            "function"
        ) {

            try {

                window.generateCode();

            }
            catch (error) {

                console.error(
                    "STRANGIS — error generando código:",
                    error
                );

            }

        }


        return (
            savedProducts[0] ||
            product
        );

    }
    catch (error) {

        console.error(
            "STRANGIS — error inesperado guardando producto:",
            error
        );


        alert(
            "❌ No se pudo guardar el producto:\n\n" +
            (
                error?.message ||
                String(error)
            )
        );


        return null;

    }

}


/* =====================================================
   RECARGAR PRODUCTOS
===================================================== */

async function refreshProducts() {

    return await loadProductsFromSupabase();

}


/* =====================================================
   INICIALIZACIÓN
===================================================== */

async function initStrangisProducts() {

    try {

        await loadProductsFromSupabase();

        return STRANGIS_PRODUCTS;

    }
    catch (error) {

        console.error(
            "STRANGIS — no se pudieron cargar productos:",
            error
        );

        return [];

    }

}


/* =====================================================
   EXPORTACIÓN GLOBAL
===================================================== */

window.STRANGIS_PRODUCTS =
    STRANGIS_PRODUCTS;

window.STRANGIS_ALLOWED_CATEGORIES =
    STRANGIS_ALLOWED_CATEGORIES;

window.supabaseClient =
    supabaseClient;

window.normalizeProduct =
    normalizeProduct;

window.loadProductsFromSupabase =
    loadProductsFromSupabase;

window.refreshProducts =
    refreshProducts;

window.initStrangisProducts =
    initStrangisProducts;

window.getProducts =
    getProducts;

window.getActiveProducts =
    getActiveProducts;

window.getProductsByCategory =
    getProductsByCategory;

window.getActiveProductsByCategory =
    getActiveProductsByCategory;

window.getProductById =
    getProductById;

window.getProductByReference =
    getProductByReference;

window.productReferenceExists =
    productReferenceExists;

window.getCategoryName =
    getCategoryName;

window.getProductImages =
    getProductImages;

window.getProductImage =
    getProductImage;

window.getProductVariants =
    getProductVariants;

window.getProductSizes =
    getProductSizes;

window.isValidProductCategory =
    isValidProductCategory;

window.getProductFormValues =
    getProductFormValues;

window.getFormVariants =
    getFormVariants;

window.getFormSizes =
    getFormSizes;

window.validateProductVariants =
    validateProductVariants;

window.validateProductData =
    validateProductData;

window.buildProductFromForm =
    buildProductFromForm;

window.saveProductToSupabase =
    saveProductToSupabase;


/* =====================================================
   FIN
===================================================== */

console.log(
    "STRANGIS — products.js cargado correctamente."
);
