// Inject a reusable Bootstrap modal into the page and expose helper functions
(function(){
    function createModalHtml() {
        const html = `
        <div class="modal fade" id="genericModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="genericModalTitle"></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="genericModalBody"></div>
              <div class="modal-footer" id="genericModalFooter">
                <div id="genericModalInputWrap" style="flex:1; display:none;">
                  <input id="genericModalInput" class="form-control" />
                </div>
                <button type="button" class="btn btn-secondary" id="genericModalCancel">Cancel</button>
                <button type="button" class="btn btn-primary" id="genericModalConfirm">OK</button>
              </div>
            </div>
          </div>
        </div>
        `;
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container.firstElementChild);
    }

    function ensure() {
        if (!document.getElementById('genericModal')) createModalHtml();
        const modalEl = document.getElementById('genericModal');
        if (!modalEl._bs) modalEl._bs = new bootstrap.Modal(modalEl);
        return modalEl;
    }

    function showConfirm(title, message) {
        return new Promise((resolve) => {
            const modalEl = ensure();
            document.getElementById('genericModalTitle').textContent = title || 'Confirm';
            document.getElementById('genericModalBody').textContent = message || '';
            document.getElementById('genericModalInputWrap').style.display = 'none';
            const cancelBtn = document.getElementById('genericModalCancel');
            const okBtn = document.getElementById('genericModalConfirm');

            function cleanup() {
                cancelBtn.removeEventListener('click', onCancel);
                okBtn.removeEventListener('click', onOk);
                modalEl._bs.hide();
            }
            function onOk() { cleanup(); resolve(true); }
            function onCancel() { cleanup(); resolve(false); }

            cancelBtn.addEventListener('click', onCancel);
            okBtn.addEventListener('click', onOk);
            modalEl._bs.show();
        });
    }

    function showAlert(titleOrMessage, maybeMessage) {
        const title = (maybeMessage ? titleOrMessage : 'Notice');
        const message = (maybeMessage ? maybeMessage : titleOrMessage);
        return new Promise((resolve) => {
            const modalEl = ensure();
            document.getElementById('genericModalTitle').textContent = title || 'Notice';
            document.getElementById('genericModalBody').textContent = message || '';
            document.getElementById('genericModalInputWrap').style.display = 'none';
            const cancelBtn = document.getElementById('genericModalCancel');
            const okBtn = document.getElementById('genericModalConfirm');
            cancelBtn.style.display = 'none';

            function cleanup() {
                okBtn.removeEventListener('click', onOk);
                cancelBtn.style.display = '';
                modalEl._bs.hide();
            }
            function onOk() { cleanup(); resolve(); }

            okBtn.addEventListener('click', onOk);
            modalEl._bs.show();
        });
    }

    function showPrompt(title, message, placeholder) {
        return new Promise((resolve) => {
            const modalEl = ensure();
            document.getElementById('genericModalTitle').textContent = title || 'Input';
            document.getElementById('genericModalBody').textContent = message || '';
            const inputWrap = document.getElementById('genericModalInputWrap');
            const input = document.getElementById('genericModalInput');
            input.value = '';
            input.placeholder = placeholder || '';
            inputWrap.style.display = '';

            const cancelBtn = document.getElementById('genericModalCancel');
            const okBtn = document.getElementById('genericModalConfirm');

            function cleanup() {
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                modalEl._bs.hide();
                inputWrap.style.display = 'none';
            }
            function onOk() { const v = input.value.trim(); cleanup(); resolve(v); }
            function onCancel() { cleanup(); resolve(null); }

            cancelBtn.addEventListener('click', onCancel);
            okBtn.addEventListener('click', onOk);
            modalEl._bs.show();
            setTimeout(()=> input.focus(), 250);
        });
    }

    // Helper used by forms that used inline confirm()
    function confirmDeleteForm(form, message) {
        message = message || 'Are you sure you want to proceed?';
        showConfirm('Please confirm', message).then(ok => { if (ok) form.submit(); });
        return false;
    }

    // Expose globally
    window.showConfirm = showConfirm;
    window.showAlert = showAlert;
    window.showPrompt = showPrompt;
    window.confirmDeleteForm = confirmDeleteForm;
})();
