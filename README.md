# Juca Informática

Site institucional estático, com área do cliente e administração integradas ao Supabase. O GitHub Pages publica a branch configurada no repositório. Esta revisão foi preparada a partir do commit `4160014c5bf3303f9db0e1f768c94838d310f15c`.

## Melhorias desta revisão

- Página principal em azul-marinho, logomarca original nas identificações visíveis e destaque para locação de impressoras, Topdata e Toledo/Prix autorizadas.
- Banner com fotos de referência de 13 categorias, troca automática a cada quatro segundos, pausa e navegação manual. Respeita a preferência por movimento reduzido e protege o foco de teclado nas imagens ocultas.
- Fotografias de terceiros são referências de categorias, não garantia de estoque. Os endereços externos podem mudar; substituir por fotos próprias ou fornecidas pelos fabricantes conforme o catálogo real da loja.

- Estatísticas com datas de Mato Grosso do Sul, consulta paginada e período completo sem corte de 365 dias.
- Abertura do balão separada do clique para WhatsApp; envio pelo formulário também contado, sem armazenar nome ou mensagem do visitante nos eventos.
- Conversão calculada por sessão; origens e dispositivos também contados por sessão.
- Tempo ativo por visualização calculado pelo maior acumulado de tempo visível. Eventos antigos não entram nessa média, pois não permitem reconstruí-la corretamente. O envio de analytics é de melhor esforço e não comprova envio de mensagens no WhatsApp.
- Recuperação de senha por e-mail e página para cadastrar nova senha.
- Edição de sistemas e ativação/desativação sem apagar o cadastro; falhas ao salvar preservam o formulário.
- Filtro explícito de cliente no portal, além das políticas de RLS existentes.
- Formulário com seleção de serviço, rótulos acessíveis e alternativa para pop-up bloqueado.
- Menu sem rolagem horizontal, janelas das marcas com controle de foco e fechamento por Escape.

## Antes de publicar a recuperação de senha

No Supabase, em Authentication → URL Configuration, confira o Site URL e adicione às Redirect URLs:

`https://www.jucainformatica.com/recuperar-senha.html`

Caso o domínio sem `www` também sirva o site, autorize a URL equivalente ou redirecione esse domínio para o endereço principal. Para homologação, adicione somente a URL exata do ambiente de teste. O SDK utiliza o fluxo implícito padrão; a página de destino recebe o evento `PASSWORD_RECOVERY` e usa `updateUser` para salvar a senha. O link deve abrir a nova página, e não a página inicial.

Verifique a configuração de envio de e-mails e teste o recebimento com uma conta controlada antes de liberar o recurso. Os testes automatizados simulam o Supabase: não enviam e-mails, não criam usuários e não alteram senhas reais.

Referência: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail

## Verificação de permissões

A inspeção somente de leitura confirmou RLS habilitada em `client_projects`, `admin_profiles`, `site_events` e `site_visits`. A política de cliente em `client_projects` compara `auth.uid()` com `client_user_id`.

Pontos ainda pendentes de uma alteração específica no banco:

- A política administrativa de projetos e as funções `create_client_user` e `list_client_users` verificam a existência de registro em `admin_profiles`, sem exigir `role = 'admin'`. Convém unificar as regras de autorização com as verificações da interface e confirmar quais perfis devem administrar o sistema.
- `admin_profiles` permite leitura pública. Revisar os consumidores antes de restringir a consulta ao próprio perfil.
- `create_client_user` grava diretamente nas tabelas de Auth. Planejar migração para a API administrativa em função de servidor, com autorização verificada.
- Testar com duas contas controladas que o cliente A não consegue ler nem alterar projetos do cliente B, pela API, além do filtro visual.

Nenhuma regra, função, conta ou configuração de produção foi alterada nesta revisão. Desativar um sistema oculta o link no portal; não revoga automaticamente credenciais de um sistema externo.

## Testes

Requer Node.js. Para os testes de navegador, disponibilize Playwright 1.62.1 e Chrome instalado, ou configure `PLAYWRIGHT_CHANNEL`.

```sh
node --test tests/metrics.test.cjs
node tests/browser.cjs
```

Se Playwright estiver disponível em outro diretório, configure `PLAYWRIGHT_MODULE` com o caminho absoluto do módulo. A suíte cria um servidor temporário apenas em `127.0.0.1`, simula o SDK do Supabase e bloqueia serviços externos. Capturas locais ficam em `test-results/` e não são publicadas. Por isso, mapas, fontes e imagens externas podem não aparecer nessas capturas.

Os testes cobrem datas, conversões, tempo ativo, paginação, falhas de consulta, menu móvel, foco das janelas, formulário, recuperação de senha, edição/ativação de sistemas e consulta do portal.

Fotos reais, depoimentos autorizados e horários de atendimento ainda dependem do conteúdo fornecido pela empresa.
