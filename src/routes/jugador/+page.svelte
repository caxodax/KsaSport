<script lang="ts">
  import { User, CreditCard, QrCode } from 'lucide-svelte';
</script>

<section class="section">
  <div class="container">
    <h1 class="title has-text-vinotinto">Portal de Autogestión</h1>
    <h2 class="subtitle">Atletas y Delegados</h2>
    
    <div class="columns is-multiline mt-4">
      <div class="column is-4">
        <div class="box has-text-centered">
          <User size={48} class="has-text-dorado mb-3" />
          <h3 class="title is-5">Perfil del Atleta</h3>
          <p>Gestiona tus datos personales y estadísticas.</p>
        </div>
      </div>
      <div class="column is-4">
        <div class="box has-text-centered">
          <CreditCard size={48} class="has-text-dorado mb-3" />
          <h3 class="title is-5">Gestión de Pagos</h3>
          <p>Reporta pagos y visualiza tu estatus financiero.</p>
        </div>
      </div>
      <div class="column is-4">
        <div class="box has-text-centered">
          <QrCode size={48} class="has-text-dorado mb-3" />
          <h3 class="title is-5">Carnet Digital</h3>
          <p>Credencial rápida para la mesa técnica.</p>
        </div>
      </div>
    </div>
  </div>
</section>
