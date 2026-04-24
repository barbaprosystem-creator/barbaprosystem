$srcDir = "c:\TRABAJO\barba construction\barba-crm\src"

$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.jsx","*.js","*.css","*.ts"
$count = 0

foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    $original = $text

    # Vocales acentuadas corruptas (UTF-8 double-encoded as Latin-1)
    $text = $text -replace ([regex]::Escape("Ã¡")), "a"
    $text = $text -replace ([regex]::Escape("Ã©")), "e"
    $text = $text -replace ([regex]::Escape("Ã­")), "i"
    $text = $text -replace ([regex]::Escape("Ã³")), "o"
    $text = $text -replace ([regex]::Escape("Ãº")), "u"
    $text = $text -replace ([regex]::Escape("Ã±")), "n"
    $text = $text -replace ([regex]::Escape("Ã¼")), "u"
    $text = $text -replace ([regex]::Escape("Â©")), "(c)"
    $text = $text -replace ([regex]::Escape("Â°")), " grados"
    $text = $text -replace ([regex]::Escape("Â¿")), ""
    $text = $text -replace ([regex]::Escape("Â¡")), ""

    # Punctuation corrupted
    $text = $text -replace ([regex]::Escape("â€"")), "-"
    $text = $text -replace ([regex]::Escape("â€"")), "-"
    $text = $text -replace ([regex]::Escape("â€™")), "'"
    $text = $text -replace ([regex]::Escape("â€œ")), '"'
    $text = $text -replace ([regex]::Escape("â€")), '"'
    $text = $text -replace ([regex]::Escape("â€¢")), "-"
    $text = $text -replace ([regex]::Escape("â€¦")), "..."
    $text = $text -replace ([regex]::Escape("â‚¬")), "EUR"

    # Broken emoji sequences - replace with text fallback
    $text = $text -replace "ðŸ[^\s'`"<>{}\[\]]*", ""

    # Remaining Ã sequences
    $text = $text -replace ([regex]::Escape("Ã ")), "a"
    $text = $text -replace ([regex]::Escape("Ã")), "A"

    if ($text -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $text, [System.Text.Encoding]::UTF8)
        $count++
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host ""
Write-Host "Total files fixed: $count"
