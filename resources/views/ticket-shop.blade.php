<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Ticket Shop V2</title>
        @vite('resources/js/ticket-shop/main.ts')
    </head>
    <body class="antialiased">
        <div id="app"></div>
    </body>
</html>
