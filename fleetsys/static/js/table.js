function displayTable(data) {
    const tableHead = document.getElementById("table-head");
    const tableBody = document.getElementById("table-body");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    if (data.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='5' class='px-4 py-2 border text-center'>No data available</td></tr>";
        return;
    }

    let parameterKeys = Object.keys(data[0]).filter(key => key.startsWith("parameter_"));
    let headerRow = `<tr class="border-b">
        <th class="px-4 py-2 border">Vessel</th>
        <th class="px-4 py-2 border">Date</th>
        <th class="px-4 py-2 border">Movement</th>
        <th class="px-4 py-2 border">Displacement</th>
    `;

    parameterKeys.forEach(paramKey => {
        headerRow += `<th class="px-4 py-2 border">${paramKey}</th>`;
    });

    headerRow += "</tr>";
    tableHead.innerHTML = headerRow;

    data.forEach(item => {
        let row = `<tr class="border-b">
            <td class="px-4 py-2 border">${item.vessel}</td>
            <td class="px-4 py-2 border">${item.date}</td>
            <td class="px-4 py-2 border">${item.movement}</td>
            <td class="px-4 py-2 border">${item.displacement}</td>
        `;

        parameterKeys.forEach(paramKey => {
            row += `<td class="px-4 py-2 border">${item[paramKey] || "-"}</td>`;
        });

        row += "</tr>";
        tableBody.innerHTML += row;
    });
}
