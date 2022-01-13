
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();



app.Use(async (context, next) =>
{
    HttpRequest req = context.Request;
    //You can extract apikey from request header by key like authentication, x-api-key as
    // req.Headers["key"];
    //Or extract apikey from request body form or x-www-form-urlencoded by key as
    // req.Form["key"];

    context.Items["apiKey"] = req.Headers["key"];
    context.Items["label"] = "username / company name";
    context.Items["email"] = "email";
    await next();
});
app.UseMiddleware<ReadmeMetricsLib.RequestResponseLogger>();



// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
