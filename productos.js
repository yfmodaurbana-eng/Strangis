/* =====================================================
   STRANGIS — MOTOR DE PRODUCTOS
   =====================================================

   IMPORTANTE:
   Aquí se añaden TODOS los productos de la tienda.

   Cada producto aparecerá automáticamente:

   • En su categoría correspondiente
   • En inicio.html
   • Con sus imágenes
   • Con sus colores
   • Con sus tallas
   • Con su precio
   • Con su stock
   • Con su información de envío
   • Con su pedido por WhatsApp

===================================================== */


const PRODUCTS = [

    /*
    =====================================================
    EJEMPLO DE ESTRUCTURA

    NO HAY NINGÚN PRODUCTO DE EJEMPLO ACTIVO.

    Cuando quieras añadir uno, utiliza esta estructura:

    {
        id: "000001",

        ref: "000001",

        name: "Nombre del producto",

        category: "camisetas",

        price: 29.99,

        stock: 10,

        description: "Descripción del producto.",

        whatsapp: "346XXXXXXXX",

        variants: [

            {
                name: "Negro",
                image: "URL-DE-LA-IMAGEN"
            },

            {
                name: "Blanco",
                image: "URL-DE-LA-OTRA-IMAGEN"
            }

        ],

        sizes: [
            "S",
            "M",
            "L",
            "XL"
        ],

        shipping: {
            min: 7,
            max: 15
        }
    }

    =====================================================
    CATEGORÍAS DISPONIBLES

    camisetas
    pantalones
    conjuntos
    gorras
    gafas
    bisuteria

    =====================================================
    */


];


/* =====================================================
   MOTOR AUXILIAR
===================================================== */


/*
   Obtener todos los productos
*/

function getProducts(){

    return PRODUCTS;

}


/*
   Obtener productos de una categoría
*/

function getProductsByCategory(category){

    return PRODUCTS.filter(
        product =>
            String(product.category)
                .toLowerCase()
                ===
            String(category)
                .toLowerCase()
    );

}


/*
   Buscar un producto por ID
*/

function getProductById(id){

    return PRODUCTS.find(
        product =>
            String(product.id)
            ===
            String(id)
    );

}


/*
   Buscar un producto por referencia
*/

function getProductByReference(ref){

    return PRODUCTS.find(
        product =>
            String(product.ref)
            ===
            String(ref)
    );

}


/*
   Obtener el nombre de una categoría
*/

function getCategoryName(category){

    const names = {

        camisetas: "Camisetas",

        pantalones: "Pantalones",

        conjuntos: "Conjuntos",

        gorras: "Gorras",

        gafas: "Gafas",

        bisuteria: "Bisutería"

    };


    return names[category] || category;

}


/* =====================================================
   EXPORTACIÓN GLOBAL
   =====================================================

   No utilizamos módulos ES6 para que funcione
   directamente al abrir la web desde un hosting
   normal sin configuración adicional.

===================================================== */


window.STRANGIS_PRODUCTS = PRODUCTS;

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
async function saveProductToSupabase(){

    const name =
        document.getElementById("productName")
            .value.trim();

    const ref =
        document.getElementById("productRef")
            .value.trim();

    const price =
        Number(
            document.getElementById("productPrice")
                .value
        ) || 0;

    const stock =
        Number(
            document.getElementById("productStock")
                .value
        ) || 0;

    const description =
        document.getElementById("productDescription")
            .value.trim();

    const whatsapp =
        document.getElementById("productWhatsapp")
            .value
            .replace(/\D/g, "");

    const shippingMin =
        document.getElementById("shippingMin")
            .value.trim();

    const shippingMax =
        document.getElementById("shippingMax")
            .value.trim();

    if(!name){

        alert("Introduce el nombre del producto.");

        return;
    }

    if(!ref){

        alert("Introduce la referencia / ID.");

        return;
    }

    const validVariants =
        variants.filter(
            variant =>
                variant.name.trim() ||
                variant.image.trim()
        );

    if(!validVariants.length){

        alert("Añade al menos un color.");

        return;
    }

    for(const variant of validVariants){

        if(!variant.name.trim()){

            alert(
                "Todos los colores deben tener nombre."
            );

            return;
        }

        if(!variant.image.trim()){

            alert(
                "Todos los colores deben tener una URL de imagen."
            );

            return;
        }

    }

    const validSizes =
        sizes
            .map(size => String(size).trim())
            .filter(Boolean);

    const product = {

        name: name,

        ref: ref,

        price: price,

        stock: stock,

        description: description,

        whatsapp: whatsapp,

        variants: validVariants,

        sizes: validSizes,

        shipping: {

            min: shippingMin,

            max: shippingMax

        }

    };

    try{

        const {
            data: sessionData
        } =
            await supabaseClient
                .auth
                .getSession();

        const session =
            sessionData.session;

        if(!session){

            alert(
                "Debes iniciar sesión como administrador antes de guardar."
            );

            return;
        }

        const {
            error
        } =
            await supabaseClient
                .from("Products")
                .insert(product);

        if(error){

            console.error(error);

            alert(
                "Error al guardar el producto:\n\n" +
                error.message
            );

            return;
        }

        alert(
            "✅ Producto guardado correctamente en Supabase."
        );

        generateCode();

    }

    catch(error){

        console.error(error);

        alert(
            "No se pudo conectar con Supabase."
        );

    }

}
