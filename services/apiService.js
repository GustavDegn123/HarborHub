// Example of a service file for API calls

export async function getData() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    return await response.json();
  } catch (error) {
    console.error("API fetch error:", error);
  }
}
