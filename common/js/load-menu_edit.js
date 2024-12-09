fetch("/common/menu.html")
.then(response => response.text())
.then(data => {
	document.getElementById("side-menu").innerHTML = data;
})