# system-design-concepts

Uma API didática em Node.js, Express e TypeScript que coloca em prática quatro padrões clássicos de sistemas distribuídos. Cada um deles resolve um problema real que aparece quando você tem mais de um serviço conversando pela rede.

## Idempotência

Seu cliente enviou uma requisição de pagamento, a conexão caiu, ele reenviou. Sem idempotência, o usuário toma chargeback. Com idempotência, o servidor reconhece a segunda chamada como duplicada e devolve o resultado da primeira — sem processar de novo.

A ideia é simples: o cliente envia um identificador único (`idempotency-key`), o servidor guarda o resultado atrelado a essa chave, e nas próximas vezes só consulta o que já salvou. Não importa se a requisição chega uma, duas ou dez vezes — o efeito no sistema é o mesmo.

## Fila e Dead Letter Queue

Processamento síncrono nem sempre dá certo. Quando um pedido chega, a API enfileira e responde na hora com `202 Accepted`. Depois um worker pega aquela mensagem e processa em segundo plano.

A Dead Letter Queue é o "hospital" das mensagens. Se uma mensagem tenta ser processada, falha, tenta de novo, falha de novo e esgota as tentativas, ela não pode travar a fila inteira. Ela vai pra DLQ. Um desenvolvedor pode depois inspecionar a DLQ, entender o que deu errado, consertar e reprocessar manualmente. Sem DLQ, uma mensagem malformada derruba o worker pra sempre.

## Retry com Backoff Exponencial

Coisas quebram. Rede instável, banco lento, serviço terceiro fora do ar. A pergunta é: o que você faz depois que algo falha?

Retry linear resolve, mas se todo mundo tentar de novo ao mesmo tempo, você só piora a situação (Thundering Herd). Backoff exponencial dá uma pausa cada vez maior entre as tentativas: 2 segundos, 4 segundos, 8 segundos. O serviço downstream ganha tempo pra se recuperar, e você não sobrecarrega ele de novo no momento em que ele está mais frágil.

## Heartbeat

Sistemas distribuídos não têm um interruptor central que diz "fulano está vivo". O heartbeat é um sinal periódico que cada serviço emite pra dizer "tô aqui, funcionando".

Se o monitoramento não recebe esse sinal depois de um tempo, ele assume que o serviço caiu e pode acionar alertas ou reiniciar o processo. É um mecanismo simples, barato e que evita que você descubra que um nó morreu só quando o usuário reclamar.

---

Cada um desses padrões resolve um problema específico. Juntos, formam a base de qualquer sistema distribuído minimamente robusto. O código foi escrito pra ser lido — sem comentários, sem firula, cada arquivo faz uma coisa só.
