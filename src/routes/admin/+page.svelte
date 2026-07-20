<script lang="ts">
  import { LayoutDashboard, CheckCircle, Search } from 'lucide-svelte';
</script>

<section class="section">
  <div class="container">
    <h1 class="title has-text-vinotinto">Centro de Comando</h1>
    <h2 class="subtitle">Panel de Administración UX-Móvil</h2>
    
    <div class="columns is-multiline mt-4">
      <div class="column is-4">
        <div class="box">
          <h3 class="title is-5"><LayoutDashboard class="mr-2 has-text-dorado" style="vertical-align: middle;" /> Dashboard Financiero</h3>
          <p>Métricas de solvencia vs morosidad en tiempo real.</p>
        </div>
      </div>
      <div class="column is-4">
        <div class="box">
          <h3 class="title is-5"><CheckCircle class="mr-2 has-text-dorado" style="vertical-align: middle;" /> Aprobación de Pagos</h3>
          <p>Bandeja de entrada rápida para verificar transferencias.</p>
        </div>
      </div>
      <div class="column is-4">
        <div class="box">
          <h3 class="title is-5"><Search class="mr-2 has-text-dorado" style="vertical-align: middle;" /> Directorio de Talentos</h3>
          <p>Base de datos centralizada de atletas y scouting.</p>
        </div>
      </div>
    </div>
  </div>
</section>
