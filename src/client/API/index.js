export const baseURL = "http://localhost:5000/api";


export async function upload(file) {
    try {
        const formData = new FormData();
        formData.append("file", file);
    } catch (error) {

    }
}

export async function uploadProcessed() {
    try {

    } catch (error) {

    }
}