namespace TechAsset.Domain.Exceptions;

public class ReglaNegocioException : Exception
{
    public string Codigo { get; }
    public int StatusCode { get; }
    public IReadOnlyList<string> Errores { get; }

    public ReglaNegocioException(string codigo, string mensaje, int statusCode = 400, IEnumerable<string>? errores = null)
        : base(mensaje)
    {
        Codigo = codigo;
        StatusCode = statusCode;
        Errores = errores?.ToList() ?? new List<string> { mensaje };
    }
}
