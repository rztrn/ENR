function formatNumber(value) {
    return (typeof value === "number" && !isNaN(value)) ? value.toFixed(2) : value;
}

// Function to format timestamp as "dd/mm/yy hh:mm"
function formatTimestamp(timestamp) {
    let date = new Date(timestamp);
    let dd = String(date.getDate()).padStart(2, '0');
    let mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    let yy = String(date.getFullYear()).slice(-2);
    let hh = String(date.getHours()).padStart(2, '0');
    let min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
}
