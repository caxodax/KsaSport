<script lang="ts">
  import { CalendarDays, Trophy } from 'lucide-svelte';
</script>

<section class="hero is-medium has-background-vinotinto">
  <div class="hero-body has-text-centered">
    <h1 class="title is-1 has-text-white">Kasa Sports</h1>
    <h2 class="subtitle is-4 has-text-dorado">Ecosistema Deportivo y Scouting</h2>
    <div class="buttons is-centered mt-5">
      <a href="/jugador" class="button is-dorado is-medium">
        <Trophy class="mr-2" size={20} /> Tryouts & Ligas
      </a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="columns is-multiline">
      <div class="column is-6">
        <div class="box">
          <h3 class="title is-4">
            <CalendarDays class="mr-2 has-text-vinotinto" style="vertical-align: middle;" /> 
            Próximos Eventos
          </h3>
          <p>Cartelera dinámica de eventos en Barquisimeto.</p>
        </div>
      </div>
      <!-- Add more sections based on ksaport.md -->
    </div>
  </div>
</section>
