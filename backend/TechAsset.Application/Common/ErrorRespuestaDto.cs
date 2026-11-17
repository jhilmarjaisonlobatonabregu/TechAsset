namespace TechAsset.Application.Common;

public class ErrorRespuestaDto
{
    public bool Exito { get; set; } = false;
    public string Codigo { get; set; } = "ERROR";
    public string Mensaje { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public IReadOnlyList<string> Errores { get; set; } = Array.Empty<string>();

    public static ErrorRespuestaDto Crear(string codigo, string mensaje, IEnumerable<string>? errores = null)
    {
        var lista = errores?.ToList() ?? new List<string> { mensaje };
        return new ErrorRespuestaDto
        {
            Exito = false,
            Codigo = codigo,
            Mensaje = mensaje,
            Message = mensaje,
            Errores = lista
        };
    }
}
