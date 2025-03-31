import { DataTypes, Model, Sequelize } from 'sequelize';
import { DB, Users } from "@app/database";
import { PROVIDERS, UserProvidersAttributes } from '@app/types';


class UserProviders extends Model<UserProvidersAttributes> {

  public static initialize() {
    const sequelize = DB.getInstance() as Sequelize;

    UserProviders.init(
      {
        id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: Users,
            key: 'id',
          },
        },
        clientId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        provider: {
          type: DataTypes.ENUM,
          values: Object.values(PROVIDERS),
          allowNull: false,
          defaultValue: PROVIDERS.GOOGLE,
        },
        locale: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        picture: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'user_providers',
        timestamps: true,
        underscored: true,
      }
    );
  }
}


UserProviders.initialize();

UserProviders.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
Users.hasMany(UserProviders, { foreignKey: 'userId', as: 'providers' });

export { UserProviders };
