function abrirModal(modalId) {
  var modal = document.getElementById(modalId);
  modal.style.display = 'block';
  setTimeout(() => modal.classList.add('show'), 10);
}

  
  function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }
  document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
      var modals = document.getElementsByClassName('modal');
      for (let modal of modals) {
        modal.style.display = 'none';
        modal.classList.remove('show');
      }
    }
  });
  
  
  window.onclick = function(event) {
    var modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    }
  }
  
  document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Impede o comportamento padrão do formulário

    // Coletar os dados do formulário
    const formData = new FormData(this);

    // Enviar os dados via fetch API
    fetch("https://formspree.io/f/mgveezer", {
        method: "POST",
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    }).then(function(response) {
        if (response.ok) {
            document.getElementById('formMessage').innerHTML = "Mensagem enviada com sucesso!";
            document.getElementById('contactForm').reset(); // Limpa o formulário após o envio
        } else {
            document.getElementById('formMessage').innerHTML = "Ocorreu um erro. Tente novamente.";
        }
    }).catch(function(error) {
        document.getElementById('formMessage').innerHTML = "Ocorreu um erro ao enviar o formulário.";
    });
});
