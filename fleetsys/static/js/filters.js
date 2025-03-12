function openFilterPane() {
    document.getElementById("filter-pane").classList.remove("translate-x-full");
}

function closeFilterPane() {
    document.getElementById("filter-pane").classList.add("translate-x-full");
}

function getSelectedParameters() {
    return Array.from(document.querySelectorAll("#parameter-checkboxes input:checked"))
                .map(checkbox => checkbox.value);
}
