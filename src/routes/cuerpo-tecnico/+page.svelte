<script lang="ts">
  import { Users, ShieldAlert } from 'lucide-svelte';
</script>

<section class="section">
  <div class="container">
    <h1 class="title has-text-vinotinto">Portal del Cuerpo Técnico</h1>
    <h2 class="subtitle">Managers y Coaches</h2>
    
    <div class="box mt-5">
      <h3 class="title is-4">
        <Users class="mr-2" style="vertical-align: middle;" />
        Gestión de Roster
      </h3>
      <p>Arma tu plantilla y convoca jugadores para el próximo encuentro.</p>
      <div class="notification is-warning mt-4">
        <ShieldAlert class="mr-2" style="vertical-align: middle;" />
        <strong>Semáforo Financiero Activo:</strong> Los atletas con estatus moroso no podrán ser convocados a la alineación titular.
      </div>
    </div>
  </div>
</section>
