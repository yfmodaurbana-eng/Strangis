/* =========================================================
   STRANGIS — PRODUCTS.JS
   MOTOR DE PRODUCTOS + SUPABASE
   REFERENCIAS AUTOMÁTICAS POR PRODUCTO E IMAGEN
   ========================================================= */

"use strict";


/* =========================================================
   SUPABASE
========================================================= */

const STRANGIS_SUPABASE_URL =
    "https://xbbjfatmdbxbuoqdrgoj.supabase.co";

const STRANGIS_SUPABASE_KEY =
    "sb_publishable_M7ETdIWvj4nCQZ55i24Vpw_5Yc5Islk";

const STRANGIS_PRODUCTS_TABLE =
    "Products";


/* =========================================================
   CONFIGURACIÓN
========================================================= */

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


/* =========================================================
   MEMORIA
========================================================= */

const STRANGIS_PRODUCTS = [];


/* =========================================================
   UTILIDADES
========================================================= */

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

        return JSON.parse(
            text
        );

    }
    catch {

        return value;

    }

}


/* =========================================================
   REFERENCIAS AUTOMÁTICAS
========================================================= */

/*
 * Generamos referencias que no dependen
 * de que el usuario escriba nada.
 *
 * Ejemplo:
 *
 * STR-000001
 * STR-000002
 *
 * IMG-000001
 * IMG-000002
 */

function generateProductReference() {

    const now =
        Date.now()
            .toString(36)
            .toUpperCase();


    const random =
        Math.random()
            .toString(36)
            .substring(
                2,
                7
            )
            .toUpperCase();


    return `STR-${now}-${random}`;

}


function generateImageReference() {

    const now =
        Date.now()
            .toString(36)
            .toUpperCase();


    const random =
        Math.random()
            .toString(36)
            .substring(
                2,
                7
            )
            .toUpperCase();


    return `IMG-${now}-${random}`;

}


/*
 * Genera una referencia de producto
 * que no exista en memoria.
 */

function generateUniqueProductReference() {

    let reference = "";


    do {

        reference =
            generateProductReference();

    }
    while (
        productReferenceExists(
            reference
        )
    );


    return reference;

}


/*
 * Comprueba referencias de imagen
 * existentes en todos los productos.
 */

function imageReferenceExists(
    reference
) {

    const wanted =
        strangisString(
            reference
        ).toLowerCase();


    if (!wanted) {

        return false;

    }


    for (
        const product
        of STRANGIS_PRODUCTS
    ) {

        const images =
            normalizeProductImages(
                product?.images
            );


        for (
            const image
            of images
        ) {

            if (
                strangisString(
                    image?.ref
                ).toLowerCase() ===
                wanted
            ) {

                return true;

            }

        }

    }


    return false;

}


function generateUniqueImageReference() {

    let reference = "";


    do {

        reference =
            generateImageReference();

    }
    while (
        imageReferenceExists(
            reference
        )
    );


    return reference;

}


/* =========================================================
   NORMALIZAR IMAGEN
========================================================= */

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

            image: image,

            ref:
                generateUniqueImageReference()

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


    const ref =
        strangisString(
            item.ref ||
            item.reference ||
            item.image_ref ||
            item.imageReference
        );


    if (!image) {

        return null;

    }


    return {

        name,

        image,

        ref:
            ref ||
            generateUniqueImageReference()

    };

}


/* =========================================================
   NORMALIZAR LISTA DE IMÁGENES
========================================================= */

function normalizeProductImages(value) {

    let raw =
        strangisParseJSON(
            value
        );


    if (
        raw === null ||
        raw === undefined ||
        raw === ""
    ) {

        return [];

    }


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


/* =========================================================
   CLIENTE SUPABASE
========================================================= */

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
                    JSON.parse(
                        text
                    );

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
                data?.code ||
                null;


            error.details =
                data?.details ||
                null;


            error.hint =
                data?.hint ||
                null;


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

            }

        };

    }

};


/* =========================================================
   NORMALIZAR PRODUCTO
========================================================= */

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


    /*
     * Si el producto antiguo no tiene
     * referencia, generamos una.
     */

    normalized.ref =
        strangisString(
            product.ref
        ) ||
        generateUniqueProductReference();


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


    normalized.images =
        normalizeProductImages(
            product.images
        );


    /*
     * Compatibilidad con image.
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
     * Compatibilidad con image_url.
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


    /*
     * TALLAS
     */

    const rawSizes =
        strangisParseJSON(
            product.sizes
        );


    if (
        Array.isArray(
            rawSizes
        )
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


    return normalized;

}


/* =========================================================
   CARGAR PRODUCTOS
========================================================= */

async function loadProductsFromSupabase() {

    console.log(
        "STRANGIS — cargando productos..."
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
        Array.isArray(
            result.data
        )
            ? result.data
            : [];


    console.log(
        "STRANGIS — respuesta Supabase:",
        products
    );


    STRANGIS_PRODUCTS.length =
        0;


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


/* =========================================================
   GETTERS
========================================================= */

function getProducts() {

    return STRANGIS_PRODUCTS;

}


function getActiveProducts() {

    return STRANGIS_PRODUCTS.filter(
        product =>
            product?.active !== false
    );

}


function getProductsByCategory(
    category
) {

    const wanted =
        strangisNormalizeCategory(
            category
        );


    return STRANGIS_PRODUCTS.filter(
        product =>
            strangisNormalizeCategory(
                product?.category
            ) === wanted
    );

}


function getActiveProductsByCategory(
    category
) {

    const wanted =
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
                ) === wanted
            );

        }
    );

}


/* =========================================================
   PRODUCTO POR ID
========================================================= */

function getProductById(id) {

    if (
        id === null ||
        id === undefined
    ) {

        return undefined;

    }


    const wanted =
        String(id);


    return STRANGIS_PRODUCTS.find(
        product =>
            String(
                product?.id
            ) === wanted
    );

}


/* =========================================================
   PRODUCTO POR REFERENCIA
========================================================= */

function getProductByReference(
    ref
) {

    const wanted =
        strangisString(
            ref
        ).toLowerCase();


    if (!wanted) {

        return undefined;

    }


    return STRANGIS_PRODUCTS.find(
        product =>
            strangisString(
                product?.ref
            ).toLowerCase() === wanted
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


/* =========================================================
   CATEGORÍA
========================================================= */

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


/* =========================================================
   IMÁGENES
========================================================= */

function getProductImages(
    product
) {

    if (!product) {

        return [];

    }


    return normalizeProductImages(
        product.images
    )

        .map(
            item =>
                item.image
        )

        .filter(Boolean);

}


/* =========================================================
   PRIMERA IMAGEN
========================================================= */

function getProductImage(
    product
) {

    const images =
        getProductImages(
            product
        );


    return images[0] || "";

}


/* =========================================================
   VARIANTES / IMÁGENES CON REFERENCIA
========================================================= */

function getProductVariants(
    product
) {

    if (!product) {

        return [];

    }


    return normalizeProductImages(
        product.images
    );

}


/* =========================================================
   TALLAS
========================================================= */

function getProductSizes(
    product
) {

    if (!product) {

        return [];

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
        typeof sizes === "string"
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


/* =========================================================
   VALIDACIÓN
========================================================= */

function isValidProductCategory(
    category
) {

    return STRANGIS_ALLOWED_CATEGORIES.includes(
        strangisNormalizeCategory(
            category
        )
    );

}


/* =========================================================
   FORMULARIO
========================================================= */

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


/* =========================================================
   VARIANTES DEL FORMULARIO
========================================================= */

function getFormVariants() {

    const source =
        Array.isArray(
            window.variants
        )
            ? window.variants
            : [];


    return source

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
                    ),

                /*
                 * La referencia se genera
                 * automáticamente para
                 * cada imagen.
                 */

                ref:
                    strangisString(
                        variant?.ref
                    ) ||
                    generateUniqueImageReference()

            })
        )

        .filter(
            variant =>
                variant.name ||
                variant.image
        );

}


/* =========================================================
   TALLAS FORMULARIO
========================================================= */

function getFormSizes() {

    const source =
        Array.isArray(
            window.sizes
        )
            ? window.sizes
            : [];


    return source

        .map(
            size =>
                strangisString(
                    size
                )
        )

        .filter(Boolean);

}


/* =========================================================
   VALIDAR VARIANTES
========================================================= */

function validateProductVariants(
    variants
) {

    if (
        !Array.isArray(
            variants
        ) ||
        !variants.length
    ) {

        return {

            valid: false,

            message:
                "Añade al menos una imagen con su color."

        };

    }


    for (
        const variant
        of variants
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
                    "Todas las imágenes necesitan una URL."

            };

        }

    }


    return {

        valid: true,

        message: ""

    };

}


/* =========================================================
   VALIDAR PRODUCTO
========================================================= */

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


    return validateProductVariants(
        variants
    );

}


/* =========================================================
   CONSTRUIR PRODUCTO
========================================================= */

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


    /*
     * REFERENCIA AUTOMÁTICA DEL PRODUCTO
     */

    const productReference =
        generateUniqueProductReference();


    /*
     * REFERENCIAS AUTOMÁTICAS
     * DE CADA IMAGEN
     */

    const images =
        variants.map(
            variant => ({

                name:
                    variant.name,

                image:
                    variant.image,

                ref:
                    variant.ref ||
                    generateUniqueImageReference()

            })
        );


    const product = {

        name:
            data.name,

        category:
            data.category,

        /*
         * REFERENCIA AUTOMÁTICA
         */

        ref:
            productReference,

        price:
            data.price,

        stock:
            data.stock,

        description:
            data.description,

        whatsapp:
            data.whatsapp,

        /*
         * CADA IMAGEN TIENE
         * SU PROPIA REFERENCIA
         */

        images:
            images,

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


/* =========================================================
   GUARDAR PRODUCTO
========================================================= */

async function saveProductToSupabase() {

    try {

        const built =
            buildProductFromForm();


        if (
            built.error
        ) {

            alert(
                built.error
            );

            return null;

        }


        const product =
            built.product;


        console.log(
            "STRANGIS — PRODUCTO GENERADO:",
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


        if (
            result.error
        ) {

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
                    "Ya existe una referencia igual en Supabase.";

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


                const index =
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
                    index >= 0
                ) {

                    STRANGIS_PRODUCTS[index] =
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
            "✅ Producto guardado correctamente.\n\n" +
            `Referencia producto: ${product.ref}\n` +
            `Imágenes: ${product.images.length}`
        );


        /*
         * Si existe generateCode
         * lo mantenemos compatible.
         */

        if (
            typeof window.generateCode ===
            "function"
        ) {

            try {

                window.generateCode();

            }
            catch (error) {

                console.error(
                    "STRANGIS — generateCode:",
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
            "STRANGIS — error inesperado:",
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


/* =========================================================
   REFRESH
========================================================= */

async function refreshProducts() {

    return await loadProductsFromSupabase();

}


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


/* =========================================================
   EXPORTACIÓN GLOBAL
========================================================= */

window.STRANGIS_PRODUCTS =
    STRANGIS_PRODUCTS;

window.STRANGIS_ALLOWED_CATEGORIES =
    STRANGIS_ALLOWED_CATEGORIES;

window.STRANGIS_CATEGORY_NAMES =
    STRANGIS_CATEGORY_NAMES;

window.supabaseClient =
    supabaseClient;

window.normalizeProduct =
    normalizeProduct;

window.normalizeProductImages =
    normalizeProductImages;

window.generateProductReference =
    generateProductReference;

window.generateImageReference =
    generateImageReference;

window.generateUniqueProductReference =
    generateUniqueProductReference;

window.generateUniqueImageReference =
    generateUniqueImageReference;

window.imageReferenceExists =
    imageReferenceExists;

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


/* =========================================================
   FIN
========================================================= */

console.log(
    "STRANGIS — products.js cargado correctamente."
);
